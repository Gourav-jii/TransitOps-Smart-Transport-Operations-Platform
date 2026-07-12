import { Response } from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle';
import FuelLog from '../models/FuelLog';
import Expense from '../models/Expense';
import MaintenanceLog from '../models/MaintenanceLog';
import Trip from '../models/Trip';
import { AuthRequest } from '../middlewares/authMiddleware';

const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * @route   GET /api/v1/analytics/vehicle/:id/financial-summary
 * @desc    Calculate and retrieve financial metrics for a specific vehicle
 * @access  Private (All Roles)
 */
export const getVehicleFinancialSummary = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid vehicle ID format');
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    const vehicleId = new mongoose.Types.ObjectId(id);

    // 1. Calculate Total Fuel Cost (from FuelLog collection)
    const fuelStats = await FuelLog.aggregate([
      { $match: { vehicle: vehicleId } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          totalLiters: { $sum: '$liters' },
        },
      },
    ]);
    const totalFuelCost = fuelStats.length > 0 ? fuelStats[0].totalCost : 0;
    const totalLitersRefueled = fuelStats.length > 0 ? fuelStats[0].totalLiters : 0;

    // 2. Calculate Total Maintenance Cost (from MaintenanceLog collection)
    const maintenanceStats = await MaintenanceLog.aggregate([
      { $match: { vehicle: vehicleId, status: 'Completed' } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
        },
      },
    ]);
    const totalMaintenanceCost = maintenanceStats.length > 0 ? maintenanceStats[0].totalCost : 0;

    // 3. Calculate Other General Expenses (from Expense collection)
    // NOTE: In our calculations, we want to sum expenses categorized as non-fuel/non-maintenance
    // to avoid double counting if those were logged in both places, or we can just sum all general expenses.
    // Let's sum all general expenses logged in the Expense model, excluding those with type 'Fuel' or 'Maintenance'
    // if we expect them to be captured in their respective collections, or keep them if they are separate.
    // The prompt says: "Operational Cost = Fuel + Maintenance + Other Expenses"
    // So we'll sum expenses where type is NOT 'Fuel' and NOT 'Maintenance'
    const otherExpensesStats = await Expense.aggregate([
      {
        $match: {
          vehicle: vehicleId,
          expenseType: { $nin: ['Fuel', 'Maintenance'] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    const otherExpensesCost = otherExpensesStats.length > 0 ? otherExpensesStats[0].totalAmount : 0;

    // Operational Cost = Fuel + Maintenance + Other Expenses
    const operationalCost = totalFuelCost + totalMaintenanceCost + otherExpensesCost;

    // 4. Calculate Trip statistics (Distance, Fuel Consumed, Revenue from Completed Trips)
    const tripStats = await Trip.aggregate([
      { $match: { vehicle: vehicleId, status: 'Completed' } },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$actualDistance' },
          totalFuelConsumed: { $sum: '$fuelConsumed' },
          totalRevenue: { $sum: '$revenue' },
        },
      },
    ]);

    const totalDistance = tripStats.length > 0 ? tripStats[0].totalDistance : 0;
    const totalFuelConsumed = tripStats.length > 0 ? tripStats[0].totalFuelConsumed : 0;
    const totalRevenue = tripStats.length > 0 ? tripStats[0].totalRevenue : 0;

    // Fuel Efficiency = Distance / Fuel Consumed
    const fuelEfficiency = totalFuelConsumed > 0 ? Number((totalDistance / totalFuelConsumed).toFixed(2)) : 0;

    // Cost Per Kilometer = Total Operational Cost / Distance
    const costPerKm = totalDistance > 0 ? Number((operationalCost / totalDistance).toFixed(2)) : 0;

    // Vehicle ROI = (Revenue - Operational Cost) / Acquisition Cost
    const acquisitionCost = vehicle.acquisitionCost || 0;
    const netProfit = totalRevenue - operationalCost;
    const roi = acquisitionCost > 0 ? Number(((netProfit / acquisitionCost) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      message: 'Vehicle financial summary calculated successfully',
      data: {
        vehicle: {
          _id: vehicle._id,
          registrationNumber: vehicle.registrationNumber,
          vehicleName: vehicle.vehicleName,
          acquisitionCost,
        },
        metrics: {
          totalFuelCost: Number(totalFuelCost.toFixed(2)),
          totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
          otherExpensesCost: Number(otherExpensesCost.toFixed(2)),
          operationalCost: Number(operationalCost.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          netProfit: Number(netProfit.toFixed(2)),
          totalDistance: Number(totalDistance.toFixed(2)),
          totalFuelConsumed: Number(totalFuelConsumed.toFixed(2)),
          fuelEfficiency,
          costPerKm,
          roi,
        },
      },
    });
  } catch (error) {
    console.error('Vehicle Financial Summary Error:', (error as Error).message);
    return sendError(res, 500, 'Server error calculating financial metrics', [(error as Error).message]);
  }
};
