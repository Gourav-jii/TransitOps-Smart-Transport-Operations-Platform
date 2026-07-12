import { Router, Request, Response } from 'express';
import authRouter from './auth';
import vehicleRouter from './vehicle';
import driverRouter from './driver';
import maintenanceRouter from './maintenance';
import notificationRouter from './notification';
import tripRouter from './trip';
import fuelRouter from './fuel';
import expenseRouter from './expense';
import analyticsRouter from './analytics';
import dashboardRouter from './dashboard';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    API Health Check
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'TransitOps API Running',
  });
});

// Mount Authentication routes
router.use('/auth', authRouter);

// Mount Vehicle Management routes
router.use('/vehicles', vehicleRouter);

// Mount Driver Management routes
router.use('/drivers', driverRouter);

// Mount Maintenance Management routes
router.use('/maintenance', maintenanceRouter);

// Mount Notifications routes
router.use('/notifications', notificationRouter);

// Mount Trip Management routes
router.use('/trips', tripRouter);

// Mount Fuel Management routes
router.use('/fuel', fuelRouter);

// Mount Expense Management routes
router.use('/expenses', expenseRouter);

// Mount Analytics routes
router.use('/analytics', analyticsRouter);

// Mount Dashboard routes
router.use('/dashboard', dashboardRouter);

export default router;
