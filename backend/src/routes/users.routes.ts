import { Router } from 'express';
import { getMe, updateMe, uploadAvatar } from '../controllers/users.controller';
import { avatarUpload } from '../middleware/avatar-upload.middleware';

const router = Router();

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
