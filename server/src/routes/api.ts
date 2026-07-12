import { Router, Request, Response } from 'express';
import authRouter from './auth';
import vehicleRouter from './vehicle';
import driverRouter from './driver';
import tripRouter from './trip';
import maintenanceRouter from './maintenance';
import fuelRouter from './fuel';
import expenseRouter from './expense';
import analyticsRouter from './analytics';
import reportRouter from './report';
import notificationRouter from './notification';
import dashboardRouter from './dashboard';
import searchRouter from './search';
import auditRouter from './audit';
import documentRouter from './document';

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

// Mount Trip Management routes
router.use('/trips', tripRouter);

// Mount Maintenance Management routes
router.use('/maintenance', maintenanceRouter);

// Mount Fuel Management routes
router.use('/fuel', fuelRouter);

// Mount Expense Management routes
router.use('/expenses', expenseRouter);

// Mount Analytics routes
router.use('/analytics', analyticsRouter);

// Mount Reports routes
router.use('/reports', reportRouter);

// Mount Notifications routes
router.use('/notifications', notificationRouter);

// Mount Dashboard routes
router.use('/dashboard', dashboardRouter);

// Mount Search routes
router.use('/search', searchRouter);

// Mount Audit routes
router.use('/audit', auditRouter);

// Mount Documents routes
router.use('/documents', documentRouter);

export default router;
