import { Router } from 'express';
import { getVehicleFinancialSummary } from '../controllers/analyticsController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Financial Summary is read-only, open to all authenticated roles
router.get('/vehicle/:id/financial-summary', protect, getVehicleFinancialSummary);

export default router;
