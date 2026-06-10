import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { USER_SAFE_SELECT } from '../config/db-selects';
import { safeUnlink, avatarUrlToDiskPath } from '../utils/file';

type AuthedRequest = Request & { user?: { id: number } };

function toPublicUser(u: {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  emailVerifiedAt: Date | null;
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt.toISOString(),
    emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
  };
}


export async function getMe(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SAFE_SELECT,
  });

  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(toPublicUser(user));
}

export async function updateMe(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const displayNameRaw = req.body?.displayName;

  const data: { displayName?: string | null } = {};

  if (displayNameRaw !== undefined) {
    const displayName = String(displayNameRaw).trim();
    if (displayName.length > 0 && (displayName.length < 2 || displayName.length > 40)) {
      return res.status(400).json({ message: 'displayName must be 2–40 characters' });
    }
    data.displayName = displayName.length === 0 ? null : displayName;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SAFE_SELECT,
  });

  return res.json(toPublicUser(updated));
}

export async function uploadAvatar(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_SAFE_SELECT, avatarUrl: true },
  });

  if (!current) return res.status(404).json({ message: 'User not found' });

  const newAvatarUrl = `/uploads/avatars/${file.filename}`;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: newAvatarUrl },
    select: USER_SAFE_SELECT,
  });

  // delete old local avatar
  if (current.avatarUrl) {
    const oldPath = avatarUrlToDiskPath(current.avatarUrl);
    if (oldPath) await safeUnlink(oldPath);
  }

  return res.json(toPublicUser(updated));
}
