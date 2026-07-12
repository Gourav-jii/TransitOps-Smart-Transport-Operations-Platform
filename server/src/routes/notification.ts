import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  triggerComplianceScan,
  deleteNotification,
} from '../controllers/notificationController';

const router = Router();

// Apply auth protection to all routes
router.use(protect);

const allRoles = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

// All roles can read/mark read notifications
router.get('/', authorizeRoles(...allRoles), getNotifications);
router.patch('/read-all', authorizeRoles(...allRoles), markAllAsRead);
router.patch('/:id/read', authorizeRoles(...allRoles), markAsRead);
router.delete('/delete/:id', authorizeRoles(...allRoles), deleteNotification);

// Only Fleet Manager and Safety Officer can trigger manual scans
router.post('/scan', authorizeRoles('Fleet Manager', 'Safety Officer'), triggerComplianceScan);

export default router;
