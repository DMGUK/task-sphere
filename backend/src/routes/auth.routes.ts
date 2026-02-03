import { Router } from 'express';
import { login, register, resendVerification, verifyEmail } from '../controllers/auth.controller';
import { authRequired } from '../middleware/auth.middleware';

const router = Router();
router.post('/register', register);
router.post('/login', login);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authRequired, resendVerification);

export default router;
