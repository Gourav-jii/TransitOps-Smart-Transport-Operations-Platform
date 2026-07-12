import { Router } from 'express';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAvailableDrivers,
} from '../controllers/tripController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Protected Routes (All authenticated roles can read details)
router.get('/drivers/available', protect, getAvailableDrivers);
router.get('/', protect, getTrips);
router.get('/:id', protect, getTripById);

// Operations Routes (Only Fleet Managers and Dispatchers can modify trips)
router.post('/', protect, authorizeRoles('Fleet Manager', 'Dispatcher'), createTrip);
router.put('/:id', protect, authorizeRoles('Fleet Manager', 'Dispatcher'), updateTrip);
router.delete('/:id', protect, authorizeRoles('Fleet Manager', 'Dispatcher'), deleteTrip);

// Lifecycle transitions
router.patch('/:id/dispatch', protect, authorizeRoles('Fleet Manager', 'Dispatcher'), dispatchTrip);
router.patch('/:id/complete', protect, authorizeRoles('Fleet Manager', 'Dispatcher'), completeTrip);
router.patch('/:id/cancel', protect, authorizeRoles('Fleet Manager', 'Dispatcher'), cancelTrip);

export default router;
