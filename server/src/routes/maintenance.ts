import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';
import {
  createMaintenance,
  getMaintenanceLogs,
  getMaintenanceLogById,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
} from '../controllers/maintenanceController';

const router = Router();

// Apply auth protection to all routes
router.use(protect);

// Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst can READ logs
router.get('/', authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), getMaintenanceLogs);
router.get('/:id', authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), getMaintenanceLogById);

// ONLY Fleet Manager can CREATE, UPDATE, DELETE, and transition log states
router.post('/', authorizeRoles('Fleet Manager'), createMaintenance);
router.put('/:id', authorizeRoles('Fleet Manager'), updateMaintenanceLog);
router.delete('/:id', authorizeRoles('Fleet Manager'), deleteMaintenanceLog);

router.patch('/:id/start', authorizeRoles('Fleet Manager'), startMaintenance);
router.patch('/:id/complete', authorizeRoles('Fleet Manager'), completeMaintenance);
router.patch('/:id/cancel', authorizeRoles('Fleet Manager'), cancelMaintenance);

export default router;
