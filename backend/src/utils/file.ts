import path from 'path';

export function avatarKeyFor(userId: number, originalname: string): string {
  const ext = path.extname(originalname).toLowerCase() || '.png';
  return `avatars/${userId}-${Date.now()}${ext}`;
}
