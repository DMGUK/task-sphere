import request from 'supertest';
import app from '../app';
import { cleanDb, db, registerAndLogin, authHeader } from './helpers';

jest.mock('../services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

let token: string;

beforeAll(async () => {
  await cleanDb();
  ({ token } = await registerAndLogin('profile@test.com', 'password123', 'Profile User'));
});

afterAll(async () => {
  await db.$disconnect();
});

// ─── GET /api/users/me ─────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  it('returns profile for authenticated user', async () => {
    const res = await request(app).get('/api/users/me').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@test.com');
    expect(res.body.displayName).toBe('Profile User');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).toHaveProperty('emailVerifiedAt');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/users/me ───────────────────────────────────────────────────

describe('PATCH /api/users/me', () => {
  it('updates displayName', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ displayName: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('New Name');
  });

  it('clears displayName when empty string sent', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ displayName: '' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBeNull();
  });

  it('returns 400 for displayName that is 1 char', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ displayName: 'X' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for displayName longer than 40 chars', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ displayName: 'A'.repeat(41) });

    expect(res.status).toBe(400);
  });

  it('ignores unknown fields', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ displayName: 'Valid', email: 'hacker@evil.com' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@test.com');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).patch('/api/users/me').send({ displayName: 'x' });
    expect(res.status).toBe(401);
  });
});
