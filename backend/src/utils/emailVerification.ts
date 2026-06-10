import crypto from 'crypto';

export function generateVerifyToken() {
  // Token the user receives (raw)
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hash stored in DB (safer than storing raw)
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // 24h expiry (adjust as desired)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return { rawToken, tokenHash, expires };
}

export function hashVerifyToken(rawToken: string) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
