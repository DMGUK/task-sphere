import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app';

export const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

export async function cleanDb() {
  await db.note.deleteMany();
  await db.task.deleteMany();
  await db.user.deleteMany();
}

export interface AuthUser {
  token: string;
  userId: number;
  email: string;
}

export async function registerAndLogin(
  email = 'test@example.com',
  password = 'password123',
  displayName?: string,
): Promise<AuthUser> {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, displayName });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return { token: res.body.token, userId: res.body.user.id, email };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
