import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const s3 = new S3Client({ region: config.s3.region });

export function avatarKeyToUrl(key: string): string {
  if (config.s3.publicUrlBase) {
    return `${config.s3.publicUrlBase.replace(/\/$/, '')}/${key}`;
  }
  return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
}

export function avatarUrlToKey(avatarUrl: string): string | null {
  const marker = 'avatars/';
  const idx = avatarUrl.indexOf(marker);
  if (idx === -1) return null;
  return avatarUrl.slice(idx);
}

export async function uploadAvatar(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return avatarKeyToUrl(key);
}

export async function deleteAvatar(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key }));
  } catch {
    // ignore — object may already be gone
  }
}
