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
  ({ token, userId } = await registerAndLogin('tasks@test.com', 'password123'));
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.task.deleteMany();
});

// ─── GET /api/tasks ────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('returns empty array when no tasks', async () => {
    const res = await request(app).get('/api/tasks').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns only the authenticated user\'s tasks', async () => {
    const { token: other } = await registerAndLogin('other@test.com', 'password123');
    await request(app).post('/api/tasks').set(authHeader(other)).send({ title: 'Other task' });
    await request(app).post('/api/tasks').set(authHeader(token)).send({ title: 'My task' });

    const res = await request(app).get('/api/tasks').set(authHeader(token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('My task');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/tasks ───────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  it('creates a task with minimal fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'New task' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
    expect(res.body.status).toBe('todo');
    expect(res.body.completed).toBe(false);
    expect(res.body.userId).toBe(userId);
  });

  it('creates a task with all fields', async () => {
    const dueDate = '2026-12-31T00:00:00.000Z';
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Full task', description: 'Details', priority: 0, status: 'in_progress', dueDate });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Details');
    expect(res.body.priority).toBe(0);
    expect(res.body.status).toBe('in_progress');
    expect(new Date(res.body.dueDate).toISOString()).toBe(dueDate);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task' });
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/tasks/:id ──────────────────────────────────────────────────

describe('PATCH /api/tasks/:id', () => {
  let taskId: number;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Original', priority: 2 });
    taskId = res.body.id;
  });

  it('updates title', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(authHeader(token))
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('updates status and completed together', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(authHeader(token))
      .send({ status: 'done', completed: true });

    expect(res.body.status).toBe('done');
    expect(res.body.completed).toBe(true);
  });

  it('preserves unchanged fields', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(authHeader(token))
      .send({ title: 'Updated' });

    expect(res.body.priority).toBe(2);
  });

  it('returns 404 for another user\'s task', async () => {
    const { token: other } = await registerAndLogin('patch-other@test.com', 'password123');
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(authHeader(other))
      .send({ title: 'Stolen' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`).send({ title: 'x' });
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/tasks/:id ─────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  let taskId: number;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'To delete' });
    taskId = res.body.id;
  });

  it('deletes own task and returns 204', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(authHeader(token));

    expect(res.status).toBe(204);

    const check = await request(app).get('/api/tasks').set(authHeader(token));
    expect(check.body).toHaveLength(0);
  });

  it('returns 404 when deleting another user\'s task', async () => {
    const { token: other } = await registerAndLogin('del-other@test.com', 'password123');
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(authHeader(other));

    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/999999').set(authHeader(token));
    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(401);
  });
});
