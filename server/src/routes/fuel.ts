import { Router } from 'express';
import {
  createFuelLog,
  getFuelLogs,
  getFuelLogById,
  updateFuelLog,
  deleteFuelLog,
} from '../controllers/fuelController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Read access is open to all authenticated roles
router.get('/', protect, getFuelLogs);
router.get('/:id', protect, getFuelLogById);

// Create access is allowed for Fleet Managers, Financial Analysts, and Dispatchers
router.post('/', protect, authorizeRoles('Fleet Manager', 'Financial Analyst', 'Dispatcher'), createFuelLog);

// Updates and Deletes are restricted to Fleet Managers and Financial Analysts only
router.put('/:id', protect, authorizeRoles('Fleet Manager', 'Financial Analyst'), updateFuelLog);
router.delete('/:id', protect, authorizeRoles('Fleet Manager', 'Financial Analyst'), deleteFuelLog);

export default router;
