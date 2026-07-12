import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Retrieve user's notification box
router.get('/', protect, getNotifications);

// Mark single or all notifications as read
router.patch('/read', protect, markAsRead);

// Delete notification item
router.delete('/delete/:id', protect, deleteNotification);

export default router;
