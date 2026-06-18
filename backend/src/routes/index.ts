import { Router } from 'express';
import tasksRouter from './tasks.routes';
import authRouter from './auth.routes';
import usersRouter from './users.routes';
import notesRouter from './notes.routes';
import aiRouter from './ai.routes';
import { authRequired } from '../middleware/auth.middleware';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRouter);
router.use('/tasks', authRequired, tasksRouter);
router.use('/users', authRequired, usersRouter);
router.use('/notes', authRequired, notesRouter);
router.use('/ai', authRequired, aiRouter);

export default router;
