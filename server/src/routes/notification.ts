import { Router } from 'express';
<<<<<<< HEAD
import {
  getNotifications,
  markAsRead,
  deleteNotification,
=======
import { protect, authorizeRoles } from '../middlewares/authMiddleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
>>>>>>> 78475bdc11a0bb871ce31494884ec847fed2d7c8
  triggerComplianceScan,
  deleteNotification,
} from '../controllers/notificationController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth protection to all routes
router.use(protect);

<<<<<<< HEAD
// Retrieve user's notification box
router.get('/', getNotifications);

// Mark single or all notifications as read
router.patch('/read', markAsRead);

// Delete notification item
router.delete('/delete/:id', deleteNotification);
=======
const allRoles = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

// All roles can read/mark read notifications
router.get('/', authorizeRoles(...allRoles), getNotifications);
router.patch('/read-all', authorizeRoles(...allRoles), markAllAsRead);
router.patch('/:id/read', authorizeRoles(...allRoles), markAsRead);
router.delete('/delete/:id', authorizeRoles(...allRoles), deleteNotification);
>>>>>>> 78475bdc11a0bb871ce31494884ec847fed2d7c8

// Only Fleet Manager and Safety Officer can trigger manual scans
router.post('/scan', authorizeRoles('Fleet Manager', 'Safety Officer'), triggerComplianceScan);

export default router;
