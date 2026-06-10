import { Router } from 'express';
import { login, register, resendVerification, verifyEmail, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authRequired } from '../middleware/auth.middleware';

const router = Router();
router.post('/register', register);
router.post('/login', login);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authRequired, resendVerification);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
