import request from 'supertest';
import app from '../app';
import { cleanDb, db, registerAndLogin } from './helpers';

jest.mock('../services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

const { emailService } = require('../services/email.service');

beforeEach(async () => {
  await cleanDb();
  jest.clearAllMocks();
});

afterAll(async () => {
  await db.$disconnect();
});

// ─── Register ──────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates user with all fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@test.com', password: 'password123', displayName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('user@test.com');
    expect(res.body.user.displayName).toBe('Test User');
    expect(res.body.user.emailVerifiedAt).toBeNull();
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('sends verification email on register', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'verify@test.com', password: 'password123' });

    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'verify@test.com',
      expect.any(String),
      undefined,
    );
  });

  it('returns 409 for duplicate email', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dup@test.com', password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({ email: 'dup@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already in use/i);
  });

  it('normalises email to lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'UPPER@TEST.COM', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('upper@test.com');
  });

  it('returns 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'user@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for password shorter than 6 chars', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'user@test.com', password: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/i);
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ email: 'login@test.com', password: 'password123' });
  });

  it('returns JWT on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('is case-insensitive on email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'LOGIN@TEST.COM', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com' });
    expect(res.status).toBe(400);
  });
});

// ─── Email Verification ────────────────────────────────────────────────────

describe('GET /api/auth/verify-email', () => {
  it('verifies a valid token', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'verify@test.com', password: 'password123' });

    const rawToken = regRes.body.verifyUrl.split('token=')[1];
    const res = await request(app).get(`/api/auth/verify-email?token=${rawToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.emailVerifiedAt).not.toBeNull();
  });

  it('returns 400 for invalid token', async () => {
    const res = await request(app).get('/api/auth/verify-email?token=invalidtoken');
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing token', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect(res.status).toBe(400);
  });

  it('rejects a token that was already consumed (token is nulled after first use)', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'already@test.com', password: 'password123' });

    const rawToken = regRes.body.verifyUrl.split('token=')[1];
    await request(app).get(`/api/auth/verify-email?token=${rawToken}`);

    // Second attempt — token was cleared from DB, so it's now invalid
    const res = await request(app).get(`/api/auth/verify-email?token=${rawToken}`);
    expect(res.status).toBe(400);
    expect(res.body.expired).toBe(false);
  });
});

// ─── Forgot Password ───────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ email: 'forgot@test.com', password: 'password123' });
    jest.clearAllMocks();
  });

  it('sends reset email for known address', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@test.com' });

    expect(res.status).toBe(200);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'forgot@test.com',
      expect.any(String),
      undefined,
    );
  });

  it('returns same message for unknown email (enum protection)', async () => {
    const known = await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@test.com' });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@test.com' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Reset Password ────────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  let resetToken: string;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ email: 'reset@test.com', password: 'oldpassword' });
    jest.clearAllMocks();

    emailService.sendPasswordResetEmail.mockImplementationOnce(
      async (_email: string, token: string) => { resetToken = token; }
    );
    await request(app).post('/api/auth/forgot-password').send({ email: 'reset@test.com' });
  });

  it('resets password with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'newpassword456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('can log in with the new password after reset', async () => {
    await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'newpassword456' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.com', password: 'newpassword456' });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  it('cannot log in with old password after reset', async () => {
    await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'newpassword456' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.com', password: 'oldpassword' });

    expect(login.status).toBe(401);
  });

  it('rejects token replay after successful reset', async () => {
    await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'newpassword456' });

    const replay = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'anotherpassword' });

    expect(replay.status).toBe(400);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalidtoken', password: 'newpassword456' });

    expect(res.status).toBe(400);
  });

  it('rejects password shorter than 6 chars', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/i);
  });
});

// ─── Auth Middleware ───────────────────────────────────────────────────────

describe('Auth middleware', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong secret', async () => {
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign({ id: 1 }, 'wrong_secret', { expiresIn: '1h' });
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });
});
