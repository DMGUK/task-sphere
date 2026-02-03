import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { authRequired } from '../middleware/auth.middleware';
import { getMe, updateMe, uploadAvatar } from '../controllers/users.controller';

const router = Router();

// All routes here require auth
router.use(authRequired);

// GET /api/users/me
router.get('/me', getMe);

// PATCH /api/users/me
router.patch('/me', updateMe);

// ----- Avatar upload (local folder) -----
const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id ?? 'user';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPG/PNG/WEBP images are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// POST /api/users/me/avatar (field name "avatar")
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);

export default router;
