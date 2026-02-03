import { Router } from 'express';
import tasksRouter from './tasks.routes';
import authRouter from './auth.routes';
import usersRouter from './users.routes';
import { authRequired } from '../middleware/auth.middleware';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRouter);
router.use('/tasks', authRequired, tasksRouter);
router.use('/users', usersRouter); // <- protected

export default router;
