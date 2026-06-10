import path from 'path';
import fs from 'fs/promises';

export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore — file may already be gone
  }
}

export function avatarUrlToDiskPath(avatarUrl: string): string | null {
  if (!avatarUrl.startsWith('/uploads/avatars/')) return null;
  const filename = avatarUrl.replace('/uploads/avatars/', '');
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) return null;
  return path.join(process.cwd(), 'uploads', 'avatars', filename);
}
