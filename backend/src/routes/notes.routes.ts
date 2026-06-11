import { Router, RequestHandler } from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/notes.controller';

const router = Router();

router.get('/',      getNotes   as unknown as RequestHandler);
router.post('/',     createNote as unknown as RequestHandler);
router.patch('/:id', updateNote as unknown as RequestHandler);
router.delete('/:id', deleteNote as unknown as RequestHandler);

export default router;
