import { Router } from 'express';
import {
  getFleetReport,
  getVehiclesReport,
  getDriversReport,
  getTripsReport,
  getMaintenanceReport,
  getFuelReport,
  getExpensesReport,
  getFinancialReport,
  getRoiReport,
  exportCSV,
  exportPDF,
} from '../controllers/reportController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Exporter endpoints
router.get('/export/csv', protect, exportCSV);
router.get('/export/pdf', protect, exportPDF);

// Standard reports endpoints
router.get('/fleet', protect, getFleetReport);
router.get('/vehicles', protect, getVehiclesReport);
router.get('/drivers', protect, getDriversReport);
router.get('/trips', protect, getTripsReport);
router.get('/maintenance', protect, getMaintenanceReport);
router.get('/fuel', protect, getFuelReport);
router.get('/expenses', protect, getExpensesReport);
router.get('/financial', protect, getFinancialReport);
router.get('/roi', protect, getRoiReport);

export default router;
