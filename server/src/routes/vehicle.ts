import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Protected Routes (All authenticated roles have read access)
router.get('/', protect, getVehicles);
router.get('/:id', protect, getVehicleById);

// Restricted Routes (Only Fleet Manager can perform write operations)
router.post('/', protect, authorizeRoles('Fleet Manager'), createVehicle);
router.put('/:id', protect, authorizeRoles('Fleet Manager'), updateVehicle);
router.delete('/:id', protect, authorizeRoles('Fleet Manager'), deleteVehicle);

export default router;
