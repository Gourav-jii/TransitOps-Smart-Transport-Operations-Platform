import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  logout,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Private routes (protected by auth middleware)
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
