import { Router } from 'express';
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

export default router;
