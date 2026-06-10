import { Router, RequestHandler } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasks.controller';

const router = Router();

router.get('/', getTasks as unknown as RequestHandler);
router.post('/', createTask as unknown as RequestHandler);
router.patch('/:id', updateTask as unknown as RequestHandler);
router.delete('/:id', deleteTask as unknown as RequestHandler);

export default router;
