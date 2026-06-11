import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { generateVerifyToken, hashVerifyToken } from '../utils/emailVerification';
import { emailService } from '../services/email.service';
import { USER_SAFE_SELECT } from '../config/db-selects';
import { validateEmail, validatePassword } from '../utils/validation';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_super_secret_change_me';

function signToken(userId: number) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

function publicBaseUrl(req: Request) {
  const base = process.env.PUBLIC_BASE_URL;
  if (base) return base.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

export async function register(req: Request, res: Response) {
  const emailResult = validateEmail(req.body?.email);
  if (!emailResult.valid) return res.status(400).json({ message: emailResult.message });
  const email = emailResult.value;

  const passwordResult = validatePassword(req.body?.password);
  if (!passwordResult.valid) return res.status(400).json({ message: passwordResult.message });
  const password = String(req.body?.password || '');

  const displayName = String(req.body?.displayName || '').trim() || null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const { rawToken, tokenHash, expires } = generateVerifyToken();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      emailVerifyToken: tokenHash,
      emailVerifyExpires: expires,
    },
    select: USER_SAFE_SELECT,
  });

  // ← ADD EMAIL SENDING HERE
  try {
    await emailService.sendVerificationEmail(
      user.email,
      rawToken,
      user.displayName || undefined
    );
    console.log('✅ Verification email sent to:', user.email);
  } catch (emailError) {
    console.error('❌ Failed to send verification email:', emailError);
    // Don't fail registration if email fails
  }

  const verifyUrl = `${publicBaseUrl(req)}/api/auth/verify-email?token=${rawToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Email verification URL:', verifyUrl);
  }

  return res.status(201).json({
    message: 'Registered successfully. Please check your email to verify your account.',
    user: { ...user, emailVerifiedAt: null },
    verifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
  });
}

export async function login(req: Request, res: Response) {
  const emailResult = validateEmail(req.body?.email);
  if (!emailResult.valid) return res.status(400).json({ message: emailResult.message });
  const email = emailResult.value;

  const password = String(req.body?.password || '');
  if (!password) return res.status(400).json({ message: 'Password is required' });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...USER_SAFE_SELECT, passwordHash: true },
  });

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user.id);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
    },
  });
}

export async function verifyEmail(req: Request, res: Response) {
  const rawToken = String(req.query?.token || '').trim();
  if (!rawToken) return res.status(400).json({ message: 'Missing token' });

  const tokenHash = hashVerifyToken(rawToken);

  // Find user with this token (don't check expiry yet)
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: tokenHash,
    },
    select: {
      ...USER_SAFE_SELECT,
      emailVerifyExpires: true, // Include expiry to check it
    },
  });

  if (!user) {
    return res.status(400).json({ 
      message: 'Invalid verification token',
      expired: false,
    });
  }

  // Check if already verified
  if (user.emailVerifiedAt) {
    return res.json({ 
      message: 'Email already verified',
      alreadyVerified: true,
      user,
    });
  }

  // NOW check if token expired
  if (user.emailVerifyExpires && new Date() > user.emailVerifyExpires) {
    return res.status(400).json({ 
      message: 'Verification token has expired. Please request a new one.',
      expired: true,
    });
  }

  // All good - verify the user
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    select: USER_SAFE_SELECT,
  });

  return res.json({ 
    message: 'Email verified successfully',
    success: true,
    user: updated,
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const emailResult = validateEmail(req.body?.email);
  if (!emailResult.valid) return res.status(400).json({ message: emailResult.message });
  const email = emailResult.value;

  const user = await prisma.user.findUnique({ where: { email }, select: { ...USER_SAFE_SELECT } });

  // Always respond the same way to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const { rawToken, tokenHash, expires } = generateVerifyToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: tokenHash, passwordResetExpires: resetExpires },
  });

  try {
    await emailService.sendPasswordResetEmail(user.email, rawToken, user.displayName || undefined);
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const resetUrl = `${publicBaseUrl(req)}/auth/reset-password?token=${rawToken}`;
    console.log('🔐 Password reset URL:', resetUrl);
  }

  return res.json({ message: 'If that email exists, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  const rawToken = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.password || '');

  if (!rawToken) return res.status(400).json({ message: 'Token is required' });

  const passwordResult = validatePassword(newPassword);
  if (!passwordResult.valid) return res.status(400).json({ message: passwordResult.message });

  const tokenHash = hashVerifyToken(rawToken);

  const user = await prisma.user.findFirst({
    where: { passwordResetToken: tokenHash },
    select: { id: true, passwordResetExpires: true },
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

  if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
    return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });

  return res.json({ message: 'Password reset successfully. You can now log in.' });
}

export async function resendVerification(req: Request & { user?: { id: number } }, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SAFE_SELECT,
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.emailVerifiedAt) {
    return res.status(400).json({ 
      message: 'Email is already verified',
      alreadyVerified: true, // ← ADD THIS for frontend
    });
  }

  const { rawToken, tokenHash, expires } = generateVerifyToken();

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyToken: tokenHash,
      emailVerifyExpires: expires,
    },
  });

  // ← ADD EMAIL SENDING HERE
  try {
    await emailService.sendVerificationEmail(
      user.email,
      rawToken,
      user.displayName || undefined
    );
    console.log('✅ Verification email resent to:', user.email);
  } catch (emailError) {
    console.error('❌ Failed to resend verification email:', emailError);
    return res.status(500).json({ message: 'Failed to send verification email' });
  }

  const verifyUrl = `${publicBaseUrl(req)}/api/auth/verify-email?token=${rawToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Resent verification URL:', verifyUrl);
  }

  return res.json({
    message: 'Verification email sent successfully',
    success: true, // ← ADD THIS for frontend
    verifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
  });
}