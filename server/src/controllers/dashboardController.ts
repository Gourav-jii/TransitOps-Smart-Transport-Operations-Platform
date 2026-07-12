import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import analyticsService, { DashboardFilters } from '../services/analyticsService';

/**
 * Helper to format error responses consistently
 */
const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Build filters from request query parameters
 */
const parseFilters = (req: AuthRequest): DashboardFilters => {
  const { startDate, endDate, vehicleType, region } = req.query;
  return {
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    vehicleType: vehicleType ? String(vehicleType) : undefined,
    region: region ? String(region) : undefined,
  };
};

/**
 * @route   GET /api/v1/dashboard/summary
 * @desc    Get dashboard KPIs and operational summaries
 * @access  Private (All authenticated roles)
 */
export const getSummary = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const filters = parseFilters(req);
    const summary = await analyticsService.getDashboardSummary(filters);
    return res.status(200).json({
      success: true,
      message: 'Dashboard summaries retrieved successfully',
      data: summary,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   GET /api/v1/dashboard/charts
 * @desc    Get trend data and chart analytics
 * @access  Private (All authenticated roles)
 */
export const getCharts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const filters = parseFilters(req);
    const charts = await analyticsService.getDashboardCharts(filters);
    return res.status(200).json({
      success: true,
      message: 'Dashboard chart datasets retrieved successfully',
      data: charts,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   GET /api/v1/dashboard/recent-activities
 * @desc    Get recent logs of all categories
 * @access  Private (All authenticated roles)
 */
export const getRecentActivities = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const activities = await analyticsService.getRecentActivities();
    return res.status(200).json({
      success: true,
      message: 'Recent activities list retrieved successfully',
      data: activities,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   GET /api/v1/dashboard/alerts
 * @desc    Get fleet compliance warnings and score alerts
 * @access  Private (All authenticated roles)
 */
export const getAlerts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const alerts = await analyticsService.getDashboardAlerts();
    return res.status(200).json({
      success: true,
      message: 'Dashboard warning alerts retrieved successfully',
      data: alerts,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};
