import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
  getSummary,
  getCharts,
  getRecentActivities,
  getAlerts,
} from '../controllers/dashboardController';

const router = Router();

// Protect all dashboard endpoints
router.use(protect);

router.get('/summary', getSummary);
router.get('/charts', getCharts);
router.get('/recent-activities', getRecentActivities);
router.get('/alerts', getAlerts);

export default router;
