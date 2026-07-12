import { Router } from 'express';
<<<<<<< HEAD
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
=======
import { protect, authorizeRoles } from '../middlewares/authMiddleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  triggerComplianceScan,
} from '../controllers/notificationController';

const router = Router();

// Apply auth protection to all routes
router.use(protect);

// All roles can read/mark read notifications
router.get('/', authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), getNotifications);
router.patch('/read-all', authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), markAllAsRead);
router.patch('/:id/read', authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), markAsRead);

// Only Fleet Manager and Safety Officer can trigger manual scans
router.post('/scan', authorizeRoles('Fleet Manager', 'Safety Officer'), triggerComplianceScan);
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884

export default router;
