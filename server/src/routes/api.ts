import { Router, Request, Response } from 'express';
import authRouter from './auth';
import vehicleRouter from './vehicle';
import driverRouter from './driver';
import maintenanceRouter from './maintenance';
import notificationRouter from './notification';

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

export default router;
