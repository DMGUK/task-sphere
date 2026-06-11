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
let userId: number;

beforeAll(async () => {
  await cleanDb();
  ({ token, userId } = await registerAndLogin('notes@test.com', 'password123'));
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.note.deleteMany();
});

// ─── GET /api/notes ────────────────────────────────────────────────────────

describe('GET /api/notes', () => {
  it('returns empty array when no notes', async () => {
    const res = await request(app).get('/api/notes').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns notes sorted by updatedAt desc', async () => {
    await request(app).post('/api/notes').set(authHeader(token)).send({ title: 'First' });
    await request(app).post('/api/notes').set(authHeader(token)).send({ title: 'Second' });

    const res = await request(app).get('/api/notes').set(authHeader(token));
    expect(res.body[0].title).toBe('Second');
    expect(res.body[1].title).toBe('First');
  });

  it('returns only authenticated user\'s notes', async () => {
    const { token: other } = await registerAndLogin('notes-other@test.com', 'password123');
    await request(app).post('/api/notes').set(authHeader(other)).send({ title: 'Other note' });
    await request(app).post('/api/notes').set(authHeader(token)).send({ title: 'My note' });

    const res = await request(app).get('/api/notes').set(authHeader(token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('My note');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/notes ───────────────────────────────────────────────────────

describe('POST /api/notes', () => {
  it('creates note with title only', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(authHeader(token))
      .send({ title: 'Simple note' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Simple note');
    expect(res.body.color).toBe('#ffffff');
    expect(res.body.content).toBeNull();
    expect(res.body.userId).toBe(userId);
  });

  it('creates note with content and color', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(authHeader(token))
      .send({ title: 'Colorful', content: 'Some text', color: '#fef9c3' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Some text');
    expect(res.body.color).toBe('#fef9c3');
  });

  it('returns 400 for missing title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(authHeader(token))
      .send({ content: 'No title' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it('returns 400 for empty title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(authHeader(token))
      .send({ title: '   ' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/notes').send({ title: 'Note' });
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/notes/:id ──────────────────────────────────────────────────

describe('PATCH /api/notes/:id', () => {
  let noteId: number;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(authHeader(token))
      .send({ title: 'Original', color: '#ffffff' });
    noteId = res.body.id;
  });

  it('updates title', async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set(authHeader(token))
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
  });

  it('updates color', async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set(authHeader(token))
      .send({ color: '#dcfce7' });

    expect(res.body.color).toBe('#dcfce7');
  });

  it('preserves unchanged fields', async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set(authHeader(token))
      .send({ color: '#dbeafe' });

    expect(res.body.title).toBe('Original');
  });

  it('returns 404 for another user\'s note', async () => {
    const { token: other } = await registerAndLogin('note-patch-other@test.com', 'password123');
    const res = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set(authHeader(other))
      .send({ title: 'Stolen' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).patch(`/api/notes/${noteId}`).send({ title: 'x' });
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/notes/:id ─────────────────────────────────────────────────

describe('DELETE /api/notes/:id', () => {
  let noteId: number;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(authHeader(token))
      .send({ title: 'To delete' });
    noteId = res.body.id;
  });

  it('deletes own note and returns 204', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set(authHeader(token));

    expect(res.status).toBe(204);

    const check = await request(app).get('/api/notes').set(authHeader(token));
    expect(check.body).toHaveLength(0);
  });

  it('returns 404 for another user\'s note', async () => {
    const { token: other } = await registerAndLogin('note-del-other@test.com', 'password123');
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set(authHeader(other));

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete(`/api/notes/${noteId}`);
    expect(res.status).toBe(401);
  });
});
