import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasks.controller';
import { authRequired } from '../middleware/auth.middleware';

const router = Router();

// all /api/tasks routes require auth
router.use(authRequired);

router.get('/', getTasks as any);
router.post('/', createTask as any);
router.patch('/:id', updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;
