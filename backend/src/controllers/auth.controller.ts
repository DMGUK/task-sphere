import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { generateVerifyToken, hashVerifyToken } from '../utils/emailVerification';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_super_secret_change_me';

// ✅ Prisma User.id is number in your project
function signToken(userId: number) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

function publicBaseUrl(req: Request) {
  const base = process.env.PUBLIC_BASE_URL;
  if (base) return base.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function userSafeSelect() {
  return {
    id: true,
    email: true,
    displayName: true,
    avatarUrl: true,
    createdAt: true,
    emailVerifiedAt: true,
  };
}

export async function register(req: Request, res: Response) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: userSafeSelect(),
  });

  const { rawToken, tokenHash, expires } = generateVerifyToken();

  await prisma.user.update({
    where: { id: user.id }, // ✅ number
    data: {
      emailVerifyToken: tokenHash,
      emailVerifyExpires: expires,
      emailVerifiedAt: null,
    },
  });

  const verifyUrl = `${publicBaseUrl(req)}/api/auth/verify-email?token=${rawToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('Email verification URL:', verifyUrl);
  }

  return res.status(201).json({
    message: 'Registered successfully. Please verify your email.',
    user: { ...user, emailVerifiedAt: null },
    verifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
  });
}

export async function login(req: Request, res: Response) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userSafeSelect(), passwordHash: true },
  });

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user.id); // ✅ number

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

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: tokenHash,
      emailVerifyExpires: { gt: new Date() },
    },
    select: userSafeSelect(),
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  const updated = await prisma.user.update({
    where: { id: user.id }, // ✅ number
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    select: userSafeSelect(),
  });

  return res.json({ message: 'Email verified successfully', user: updated });
}

// ✅ Requires auth (soft); user clicks “resend verification”
export async function resendVerification(req: Request & { user?: { id: number } }, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId }, // ✅ number
    select: userSafeSelect(),
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.emailVerifiedAt) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  const { rawToken, tokenHash, expires } = generateVerifyToken();

  await prisma.user.update({
    where: { id: userId }, // ✅ number
    data: {
      emailVerifyToken: tokenHash,
      emailVerifyExpires: expires,
    },
  });

  const verifyUrl = `${publicBaseUrl(req)}/api/auth/verify-email?token=${rawToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('Resent verification URL:', verifyUrl);
  }

  return res.json({
    message: 'Verification email sent',
    verifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
  });
}
