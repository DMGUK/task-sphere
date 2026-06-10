import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev_super_secret_change_me';

export function authRequired(req: Request & { user?: { id: number } }, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number | string };

    const idNum = typeof payload.id === 'string' ? Number(payload.id) : payload.id;
    if (!Number.isFinite(idNum)) return res.status(401).json({ message: 'Unauthorized' });

    req.user = { id: idNum };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
