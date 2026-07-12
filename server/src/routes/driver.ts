import { Router } from 'express';
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  updateDriverSafetyScore,
} from '../controllers/driverController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Read access: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst
router.get('/', protect, authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), getDrivers);
router.get('/:id', protect, authorizeRoles('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), getDriverById);

// Write access: Fleet Manager only
router.post('/', protect, authorizeRoles('Fleet Manager'), createDriver);
router.put('/:id', protect, authorizeRoles('Fleet Manager'), updateDriver);
router.delete('/:id', protect, authorizeRoles('Fleet Manager'), deleteDriver);

// Patch updates: Fleet Manager, Safety Officer
router.patch('/:id/status', protect, authorizeRoles('Fleet Manager', 'Safety Officer'), updateDriverStatus);
router.patch('/:id/safety-score', protect, authorizeRoles('Fleet Manager', 'Safety Officer'), updateDriverSafetyScore);

export default router;
