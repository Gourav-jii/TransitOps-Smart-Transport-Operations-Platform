import { Router, Request, Response } from 'express';
import authRouter from './auth';
import vehicleRouter from './vehicle';
<<<<<<< HEAD
import tripRouter from './trip';
=======
import driverRouter from './driver';
>>>>>>> 96ec9190a97dbce2d12c1363113eb787c45c7c53

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

<<<<<<< HEAD
// Mount Trip Management routes
router.use('/trips', tripRouter);
=======
// Mount Driver Management routes
router.use('/drivers', driverRouter);
>>>>>>> 96ec9190a97dbce2d12c1363113eb787c45c7c53

export default router;
