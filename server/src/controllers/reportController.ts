import { Response } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import MaintenanceLog from '../models/MaintenanceLog';
import FuelLog from '../models/FuelLog';
import Expense from '../models/Expense';
import { AuthRequest } from '../middlewares/authMiddleware';

const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

// Helper: parse date filter
const getDateQuery = (startDate?: string, endDate?: string, fieldName: string = 'createdAt') => {
  if (!startDate && !endDate) return {};
  const query: any = {};
  query[fieldName] = {};
  if (startDate) query[fieldName].$gte = new Date(startDate);
  if (endDate) query[fieldName].$lte = new Date(endDate);
  return query;
};

// --- AGGREGATION HELPERS ---

const aggregateFleetSummary = async (filters: any) => {
  const dateQuery = getDateQuery(filters.startDate, filters.endDate, 'createdAt');

  const totalVehicles = await Vehicle.countDocuments();
  const activeVehicles = await Vehicle.countDocuments({ status: 'Available' });
  const totalDrivers = await Driver.countDocuments();

  const fuelCostResult = await FuelLog.aggregate([
    { $match: getDateQuery(filters.startDate, filters.endDate, 'fuelDate') },
    { $group: { _id: null, total: { $sum: '$cost' } } },
  ]);
  const totalFuelCost = fuelCostResult.length > 0 ? fuelCostResult[0].total : 0;

  const maintenanceResult = await MaintenanceLog.aggregate([
    {
      $match: {
        status: 'Completed',
        ...getDateQuery(filters.startDate, filters.endDate, 'endDate'),
      },
    },
    { $group: { _id: null, total: { $sum: '$cost' } } },
  ]);
  const totalMaintenanceCost = maintenanceResult.length > 0 ? maintenanceResult[0].total : 0;

  const tripStats = await Trip.aggregate([
    {
      $match: {
        status: 'Completed',
        ...getDateQuery(filters.startDate, filters.endDate, 'completedDate'),
      },
    },
    {
      $group: {
        _id: null,
        totalTrips: { $sum: 1 },
        totalDistance: { $sum: '$actualDistance' },
        totalRevenue: { $sum: '$revenue' },
      },
    },
  ]);

  const completedTrips = tripStats.length > 0 ? tripStats[0].totalTrips : 0;
  const totalDistance = tripStats.length > 0 ? tripStats[0].totalDistance : 0;
  const totalRevenue = tripStats.length > 0 ? tripStats[0].totalRevenue : 0;

  return {
    totalVehicles,
    activeVehicles,
    totalDrivers,
    completedTrips,
    totalDistance,
    totalFuelCost,
    totalMaintenanceCost,
    totalRevenue,
  };
};

const aggregateVehiclesReport = async (filters: any) => {
  const query: any = {};
  if (filters.vehicle) query._id = new mongoose.Types.ObjectId(filters.vehicle);
  if (filters.vehicleType) query.vehicleType = filters.vehicleType;
  if (filters.region) query.region = filters.region;

  const vehicles = await Vehicle.find(query);
  const reportData = [];

  for (const v of vehicles) {
    // completed trips count, distance, and revenue
    const tripStats = await Trip.aggregate([
      {
        $match: {
          vehicle: v._id,
          status: 'Completed',
          ...getDateQuery(filters.startDate, filters.endDate, 'completedDate'),
        },
      },
      {
        $group: {
          _id: null,
          trips: { $sum: 1 },
          distance: { $sum: '$actualDistance' },
          revenue: { $sum: '$revenue' },
        },
      },
    ]);
    const tripsCompleted = tripStats.length > 0 ? tripStats[0].trips : 0;
    const distanceCovered = tripStats.length > 0 ? tripStats[0].distance : 0;
    const totalRevenue = tripStats.length > 0 ? tripStats[0].revenue : 0;

    // Fuel cost
    const fuelStats = await FuelLog.aggregate([
      {
        $match: {
          vehicle: v._id,
          ...getDateQuery(filters.startDate, filters.endDate, 'fuelDate'),
        },
      },
      { $group: { _id: null, cost: { $sum: '$cost' } } },
    ]);
    const fuelCost = fuelStats.length > 0 ? fuelStats[0].cost : 0;

    // Maintenance cost
    const maintenanceStats = await MaintenanceLog.aggregate([
      {
        $match: {
          vehicle: v._id,
          status: 'Completed',
          ...getDateQuery(filters.startDate, filters.endDate, 'endDate'),
        },
      },
      { $group: { _id: null, cost: { $sum: '$cost' } } },
    ]);
    const maintenanceCost = maintenanceStats.length > 0 ? maintenanceStats[0].cost : 0;

    // Other general expenses
    const expenseStats = await Expense.aggregate([
      {
        $match: {
          vehicle: v._id,
          expenseType: { $nin: ['Fuel', 'Maintenance'] },
          ...getDateQuery(filters.startDate, filters.endDate, 'expenseDate'),
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const otherExpense = expenseStats.length > 0 ? expenseStats[0].total : 0;

    const totalExpense = fuelCost + maintenanceCost + otherExpense;
    const netProfit = totalRevenue - totalExpense;
    const acqCost = v.acquisitionCost || 0;
    const roi = acqCost > 0 ? Number(((netProfit / acqCost) * 100).toFixed(2)) : 0;

    reportData.push({
      vehicleId: v.registrationNumber,
      name: v.vehicleName,
      type: v.vehicleType,
      region: v.region || 'Global',
      status: v.status,
      tripsCompleted,
      distanceCovered,
      fuelCost,
      maintenanceCost,
      totalExpense,
      roi,
    });
  }

  return reportData;
};

const aggregateDriversReport = async (filters: any) => {
  const query: any = {};
  if (filters.driver) query._id = new mongoose.Types.ObjectId(filters.driver);
  if (filters.region) query.region = filters.region;

  const drivers = await Driver.find(query);
  const reportData = [];

  for (const d of drivers) {
    const tripStats = await Trip.aggregate([
      {
        $match: {
          driver: d._id,
          status: 'Completed',
          ...getDateQuery(filters.startDate, filters.endDate, 'completedDate'),
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const tripsCompleted = tripStats.length > 0 ? tripStats[0].count : 0;

    reportData.push({
      driverId: d.licenseNumber,
      name: d.fullName,
      status: d.status,
      licenseExpiry: d.licenseExpiry,
      tripsCompleted,
      safetyScore: d.safetyScore || 0,
    });
  }

  return reportData;
};

const aggregateTripsReport = async (filters: any) => {
  const query: any = {};
  if (filters.tripStatus) query.status = filters.tripStatus;
  if (filters.vehicle) query.vehicle = new mongoose.Types.ObjectId(filters.vehicle);
  if (filters.driver) query.driver = new mongoose.Types.ObjectId(filters.driver);

  const dateQuery = getDateQuery(filters.startDate, filters.endDate, 'plannedStartDate');
  const mergedQuery = { ...query, ...dateQuery };

  const trips = await Trip.find(mergedQuery)
    .populate('vehicle')
    .populate('driver')
    .sort({ plannedStartDate: -1 });

  return trips.map((t: any) => ({
    tripNumber: t.tripNumber,
    source: t.source,
    destination: t.destination,
    vehiclePlate: t.vehicle?.registrationNumber || 'N/A',
    driverName: t.driver?.fullName || 'N/A',
    distance: t.status === 'Completed' ? t.actualDistance : t.plannedDistance,
    fuelUsed: t.fuelConsumed || 0,
    revenue: t.revenue || t.estimatedRevenue || 0,
    status: t.status,
  }));
};

const aggregateMaintenanceReport = async (filters: any) => {
  const query: any = {};
  if (filters.maintenanceStatus) query.status = filters.maintenanceStatus;
  if (filters.vehicle) query.vehicle = new mongoose.Types.ObjectId(filters.vehicle);

  const dateQuery = getDateQuery(filters.startDate, filters.endDate, 'startDate');
  const mergedQuery = { ...query, ...dateQuery };

  const logs = await MaintenanceLog.find(mergedQuery).populate('vehicle');

  return logs.map((m: any) => ({
    maintenanceId: m._id.toString(),
    vehiclePlate: m.vehicle?.registrationNumber || 'N/A',
    serviceType: m.maintenanceType,
    cost: m.cost,
    vendor: m.vendor || 'N/A',
    status: m.status,
    scheduledDate: m.startDate,
    completedDate: m.endDate,
  }));
};

const aggregateFuelReport = async (filters: any) => {
  const query: any = {};
  if (filters.vehicle) query.vehicle = new mongoose.Types.ObjectId(filters.vehicle);
  if (filters.trip) query.trip = new mongoose.Types.ObjectId(filters.trip);

  const dateQuery = getDateQuery(filters.startDate, filters.endDate, 'fuelDate');
  const mergedQuery = { ...query, ...dateQuery };

  const logs = await FuelLog.find(mergedQuery).populate('vehicle').populate('trip');

  return logs.map((f: any) => ({
    fuelLogId: f.fuelLogId,
    vehiclePlate: f.vehicle?.registrationNumber || 'N/A',
    tripNumber: f.trip?.tripNumber || 'N/A',
    liters: f.liters,
    cost: f.cost,
    pricePerLiter: f.pricePerLiter || 0,
    fuelDate: f.fuelDate,
    fuelStation: f.fuelStation,
  }));
};

const aggregateExpensesReport = async (filters: any) => {
  const query: any = {};
  if (filters.vehicle) query.vehicle = new mongoose.Types.ObjectId(filters.vehicle);
  if (filters.expenseType) query.expenseType = filters.expenseType;

  const dateQuery = getDateQuery(filters.startDate, filters.endDate, 'expenseDate');
  const mergedQuery = { ...query, ...dateQuery };

  const logs = await Expense.find(mergedQuery).populate('vehicle');

  return logs.map((e: any) => ({
    expenseId: e.expenseId,
    vehiclePlate: e.vehicle?.registrationNumber || 'General',
    expenseType: e.expenseType,
    amount: e.amount,
    vendor: e.vendor,
    expenseDate: e.expenseDate,
    description: e.description,
  }));
};

const aggregateFinancialReport = async (filters: any) => {
  const revenueResult = await Trip.aggregate([
    {
      $match: {
        status: 'Completed',
        ...getDateQuery(filters.startDate, filters.endDate, 'completedDate'),
      },
    },
    { $group: { _id: null, total: { $sum: '$revenue' } } },
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const fuelResult = await FuelLog.aggregate([
    { $match: getDateQuery(filters.startDate, filters.endDate, 'fuelDate') },
    { $group: { _id: null, total: { $sum: '$cost' } } },
  ]);
  const totalFuelCost = fuelResult.length > 0 ? fuelResult[0].total : 0;

  const maintenanceResult = await MaintenanceLog.aggregate([
    {
      $match: {
        status: 'Completed',
        ...getDateQuery(filters.startDate, filters.endDate, 'endDate'),
      },
    },
    { $group: { _id: null, total: { $sum: '$cost' } } },
  ]);
  const totalMaintenanceCost = maintenanceResult.length > 0 ? maintenanceResult[0].total : 0;

  const otherResult = await Expense.aggregate([
    {
      $match: {
        expenseType: { $nin: ['Fuel', 'Maintenance'] },
        ...getDateQuery(filters.startDate, filters.endDate, 'expenseDate'),
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const otherExpenses = otherResult.length > 0 ? otherResult[0].total : 0;

  const totalOpex = totalFuelCost + totalMaintenanceCost + otherExpenses;
  const netProfit = totalRevenue - totalOpex;

  return {
    revenue: totalRevenue,
    fuelCost: totalFuelCost,
    maintenanceCost: totalMaintenanceCost,
    otherExpenses,
    netProfit,
  };
};

const aggregateRoiReport = async (filters: any) => {
  const query: any = {};
  if (filters.vehicle) query._id = new mongoose.Types.ObjectId(filters.vehicle);

  const vehicles = await Vehicle.find(query);
  const reportData = [];

  for (const v of vehicles) {
    const tripResult = await Trip.aggregate([
      { $match: { vehicle: v._id, status: 'Completed', ...getDateQuery(filters.startDate, filters.endDate, 'completedDate') } },
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]);
    const revenue = tripResult.length > 0 ? tripResult[0].total : 0;

    const fuelResult = await FuelLog.aggregate([
      { $match: { vehicle: v._id, ...getDateQuery(filters.startDate, filters.endDate, 'fuelDate') } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    const fuelCost = fuelResult.length > 0 ? fuelResult[0].total : 0;

    const maintResult = await MaintenanceLog.aggregate([
      { $match: { vehicle: v._id, status: 'Completed', ...getDateQuery(filters.startDate, filters.endDate, 'endDate') } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    const maintenanceCost = maintResult.length > 0 ? maintResult[0].total : 0;

    const otherResult = await Expense.aggregate([
      { $match: { vehicle: v._id, expenseType: { $nin: ['Fuel', 'Maintenance'] }, ...getDateQuery(filters.startDate, filters.endDate, 'expenseDate') } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const otherExpenses = otherResult.length > 0 ? otherResult[0].total : 0;

    const opex = fuelCost + maintenanceCost + otherExpenses;
    const profit = revenue - opex;
    const acqCost = v.acquisitionCost || 0;
    const roiPercent = acqCost > 0 ? Number(((profit / acqCost) * 100).toFixed(2)) : 0;

    reportData.push({
      vehiclePlate: v.registrationNumber,
      vehicleName: v.vehicleName,
      acquisitionCost: v.acquisitionCost || 0,
      revenue,
      opex,
      profit,
      roiPercent,
    });
  }

  return reportData;
};

// --- CONTROLLER HANDLERS ---

export const getFleetReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateFleetSummary(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Fleet report compilation failed', [(err as Error).message]);
  }
};

export const getVehiclesReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateVehiclesReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Vehicle report compilation failed', [(err as Error).message]);
  }
};

export const getDriversReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateDriversReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Driver report compilation failed', [(err as Error).message]);
  }
};

export const getTripsReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateTripsReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Trip report compilation failed', [(err as Error).message]);
  }
};

export const getMaintenanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateMaintenanceReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Maintenance report compilation failed', [(err as Error).message]);
  }
};

export const getFuelReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateFuelReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Fuel report compilation failed', [(err as Error).message]);
  }
};

export const getExpensesReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateExpensesReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Expense report compilation failed', [(err as Error).message]);
  }
};

export const getFinancialReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateFinancialReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Financial report compilation failed', [(err as Error).message]);
  }
};

export const getRoiReport = async (req: AuthRequest, res: Response) => {
  try {
    const data = await aggregateRoiReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, 'ROI report compilation failed', [(err as Error).message]);
  }
};

// --- CSV EXPORTER ---

export const exportCSV = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const reportType = req.query.reportType as string;
    let data: any[] = [];
    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'fleet': {
        const summary = await aggregateFleetSummary(req.query);
        headers = ['Total Vehicles', 'Active Vehicles', 'Total Drivers', 'Completed Trips', 'Total Distance Covered', 'Total Fuel Cost', 'Total Maintenance Cost', 'Total Revenue'];
        rows = [[
          String(summary.totalVehicles),
          String(summary.activeVehicles),
          String(summary.totalDrivers),
          String(summary.completedTrips),
          String(summary.totalDistance),
          String(summary.totalFuelCost),
          String(summary.totalMaintenanceCost),
          String(summary.totalRevenue)
        ]];
        break;
      }

      case 'financial': {
        const fin = await aggregateFinancialReport(req.query);
        headers = ['Total Revenue', 'Total Fuel Cost', 'Total Maintenance Cost', 'Other Overhead Expenses', 'Net Profit'];
        rows = [[
          String(fin.revenue),
          String(fin.fuelCost),
          String(fin.maintenanceCost),
          String(fin.otherExpenses),
          String(fin.netProfit)
        ]];
        break;
      }

      case 'vehicles':
        data = await aggregateVehiclesReport(req.query);
        headers = ['Vehicle ID', 'Name', 'Type', 'Region', 'Status', 'Trips Completed', 'Distance Covered (km)', 'Fuel Cost ($)', 'Maintenance Cost ($)', 'Total Expense ($)', 'ROI (%)'];
        rows = data.map((item) => [
          item.vehicleId,
          item.name,
          item.type,
          item.region,
          item.status,
          String(item.tripsCompleted),
          String(item.distanceCovered),
          String(item.fuelCost),
          String(item.maintenanceCost),
          String(item.totalExpense),
          String(item.roi),
        ]);
        break;

      case 'drivers':
        data = await aggregateDriversReport(req.query);
        headers = ['License ID', 'Name', 'Status', 'Expiry Date', 'Trips Completed', 'Safety Score'];
        rows = data.map((item) => [
          item.driverId,
          item.name,
          item.status,
          new Date(item.licenseExpiry).toLocaleDateString(),
          String(item.tripsCompleted),
          String(item.safetyScore),
        ]);
        break;

      case 'trips':
        data = await aggregateTripsReport(req.query);
        headers = ['Trip Number', 'Source', 'Destination', 'Vehicle Plate', 'Driver Name', 'Distance (km)', 'Fuel Used (L)', 'Revenue ($)', 'Status'];
        rows = data.map((item) => [
          item.tripNumber,
          item.source,
          item.destination,
          item.vehiclePlate,
          item.driverName,
          String(item.distance),
          String(item.fuelUsed),
          String(item.revenue),
          item.status,
        ]);
        break;

      case 'maintenance':
        data = await aggregateMaintenanceReport(req.query);
        headers = ['Job ID', 'Vehicle Plate', 'Service Type', 'Cost ($)', 'Vendor', 'Status', 'Scheduled Date', 'Completed Date'];
        rows = data.map((item) => [
          item.maintenanceId,
          item.vehiclePlate,
          item.serviceType,
          String(item.cost),
          item.vendor,
          item.status,
          new Date(item.scheduledDate).toLocaleDateString(),
          item.completedDate ? new Date(item.completedDate).toLocaleDateString() : 'N/A',
        ]);
        break;

      case 'fuel':
        data = await aggregateFuelReport(req.query);
        headers = ['Log ID', 'Vehicle Plate', 'Trip Reference', 'Liters (L)', 'Cost ($)', 'Price/Liter ($)', 'Station', 'Date'];
        rows = data.map((item) => [
          item.fuelLogId,
          item.vehiclePlate,
          item.tripNumber,
          String(item.liters),
          String(item.cost),
          String(item.pricePerLiter),
          item.fuelStation,
          new Date(item.fuelDate).toLocaleDateString(),
        ]);
        break;

      case 'expenses':
        data = await aggregateExpensesReport(req.query);
        headers = ['Expense ID', 'Vehicle Plate', 'Expense Type', 'Amount ($)', 'Vendor', 'Date', 'Description'];
        rows = data.map((item) => [
          item.expenseId,
          item.vehiclePlate,
          item.expenseType,
          String(item.amount),
          item.vendor,
          new Date(item.expenseDate).toLocaleDateString(),
          item.description,
        ]);
        break;

      case 'roi':
        data = await aggregateRoiReport(req.query);
        headers = ['Vehicle Plate', 'Name', 'Acquisition Cost ($)', 'Revenue ($)', 'Opex ($)', 'Profit ($)', 'ROI (%)'];
        rows = data.map((item) => [
          item.vehiclePlate,
          item.vehicleName,
          String(item.acquisitionCost),
          String(item.revenue),
          String(item.opex),
          String(item.profit),
          String(item.roiPercent),
        ]);
        break;

      default:
        return sendError(res, 400, 'Invalid reportType query parameter for CSV export');
    }

    // Generate CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return sendError(res, 500, 'CSV export failed', [(err as Error).message]);
  }
};

// --- PDF EXPORTER ---

export const exportPDF = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const reportType = req.query.reportType as string;
    let data: any[] = [];
    let reportTitle = '';
    let tableHeaders: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'fleet': {
        const summary = await aggregateFleetSummary(req.query);
        reportTitle = 'Fleet Operations Summary Report';
        tableHeaders = ['Metric Description', 'Logged Value'];
        rows = [
          ['Total Fleet Vehicles', String(summary.totalVehicles)],
          ['Active Working Vehicles', String(summary.activeVehicles)],
          ['Registered Fleet Drivers', String(summary.totalDrivers)],
          ['Total Completed Trips', String(summary.completedTrips)],
          ['Total Logged Distance', `${summary.totalDistance.toLocaleString()} km`],
          ['Fuel OPEX Expenses', `$${summary.totalFuelCost.toLocaleString()}`],
          ['Maintenance Repairs Expenses', `$${summary.totalMaintenanceCost.toLocaleString()}`],
          ['Total Settled Revenue', `$${summary.totalRevenue.toLocaleString()}`]
        ];
        break;
      }

      case 'financial': {
        const fin = await aggregateFinancialReport(req.query);
        reportTitle = 'Fleet Financial Performance Report';
        tableHeaders = ['Overhead Category', 'Logged Amount'];
        rows = [
          ['Total Earned Revenue', `$${fin.revenue.toLocaleString()}`],
          ['Fuel Overhead Expenses', `$${fin.fuelCost.toLocaleString()}`],
          ['Maintenance Repairs Expenses', `$${fin.maintenanceCost.toLocaleString()}`],
          ['Other Overhead Expenses', `$${fin.otherExpenses.toLocaleString()}`],
          ['Net Operational Profit', `$${fin.netProfit.toLocaleString()}`]
        ];
        break;
      }

      case 'vehicles':
        data = await aggregateVehiclesReport(req.query);
        reportTitle = 'Vehicles Operational Report';
        tableHeaders = ['Reg No', 'Type', 'Region', 'Status', 'Trips', 'Expense', 'ROI'];
        rows = data.map((item) => [
          item.vehicleId,
          item.type,
          item.region,
          item.status,
          String(item.tripsCompleted),
          `$${item.totalExpense.toLocaleString()}`,
          `${item.roi}%`,
        ]);
        break;

      case 'drivers':
        data = await aggregateDriversReport(req.query);
        reportTitle = 'Drivers Performance Report';
        tableHeaders = ['License', 'Full Name', 'Status', 'Expiry', 'Trips', 'Safety'];
        rows = data.map((item) => [
          item.driverId,
          item.name,
          item.status,
          new Date(item.licenseExpiry).toLocaleDateString(),
          String(item.tripsCompleted),
          `${item.safetyScore}/100`,
        ]);
        break;

      case 'trips':
        data = await aggregateTripsReport(req.query);
        reportTitle = 'Trips Dispatch Logs Report';
        tableHeaders = ['Trip No', 'Route', 'Vehicle', 'Driver', 'Dist (km)', 'Revenue', 'Status'];
        rows = data.map((item) => [
          item.tripNumber,
          `${item.source} -> ${item.destination}`,
          item.vehiclePlate,
          item.driverName,
          String(item.distance),
          `$${item.revenue.toLocaleString()}`,
          item.status,
        ]);
        break;

      case 'maintenance':
        data = await aggregateMaintenanceReport(req.query);
        reportTitle = 'Completed Maintenance Report';
        tableHeaders = ['Job ID', 'Vehicle', 'Type', 'Cost', 'Vendor', 'Status', 'Date'];
        rows = data.map((item) => [
          item.maintenanceId,
          item.vehiclePlate,
          item.serviceType,
          `$${item.cost.toLocaleString()}`,
          item.vendor,
          item.status,
          new Date(item.scheduledDate).toLocaleDateString(),
        ]);
        break;

      case 'fuel':
        data = await aggregateFuelReport(req.query);
        reportTitle = 'Fuel Consumption Report';
        tableHeaders = ['Log ID', 'Vehicle', 'Trip', 'Liters', 'Cost', 'Station', 'Date'];
        rows = data.map((item) => [
          item.fuelLogId,
          item.vehiclePlate,
          item.tripNumber,
          `${item.liters} L`,
          `$${item.cost.toLocaleString()}`,
          item.fuelStation,
          new Date(item.fuelDate).toLocaleDateString(),
        ]);
        break;

      case 'expenses':
        data = await aggregateExpensesReport(req.query);
        reportTitle = 'Overhead Expenditures Ledger';
        tableHeaders = ['Expense ID', 'Vehicle', 'Category', 'Amount', 'Vendor', 'Date'];
        rows = data.map((item) => [
          item.expenseId,
          item.vehiclePlate,
          item.expenseType,
          `$${item.amount.toLocaleString()}`,
          item.vendor,
          new Date(item.expenseDate).toLocaleDateString(),
        ]);
        break;

      case 'roi':
        data = await aggregateRoiReport(req.query);
        reportTitle = 'Vehicle ROI Analysis Report';
        tableHeaders = ['Vehicle Plate', 'Acq Cost', 'Revenue', 'Opex', 'Profit', 'ROI (%)'];
        rows = data.map((item) => [
          item.vehiclePlate,
          `$${item.acquisitionCost.toLocaleString()}`,
          `$${item.revenue.toLocaleString()}`,
          `$${item.opex.toLocaleString()}`,
          `$${item.profit.toLocaleString()}`,
          `${item.roiPercent}%`,
        ]);
        break;

      default:
        return sendError(res, 400, 'Invalid reportType query parameter for PDF export');
    }

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Document Header
    doc.fontSize(22).font('Helvetica-Bold').text('TransitOps', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Smart Transport Operations Platform', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).font('Helvetica-Bold').text(reportTitle, { underline: true });
    doc.moveDown(0.5);

    // Meta details
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text(`Generated By: ${req.user?.name || 'System Administrator'} (${req.user?.role || 'Guest'})`);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`);
    if (req.query.startDate || req.query.endDate) {
      doc.text(`Filters: Date range ${req.query.startDate || 'Any'} to ${req.query.endDate || 'Any'}`);
    }
    doc.moveDown(1.5).fillColor('#000000');

    // Draw simple grid columns
    const colWidth = 75;
    const startY = doc.y;

    // Draw Table Headers
    doc.fontSize(10).font('Helvetica-Bold');
    tableHeaders.forEach((header, index) => {
      doc.text(header, 40 + index * colWidth, startY, { width: colWidth, ellipsis: true });
    });
    doc.moveDown(0.5);

    // Draw a divider line
    const lineY = doc.y;
    doc.moveTo(40, lineY).lineTo(560, lineY).stroke();
    doc.moveDown(0.5);

    // Draw Table Rows
    doc.fontSize(9).font('Helvetica');
    rows.forEach((row) => {
      const currentY = doc.y;
      row.forEach((cell, index) => {
        doc.text(cell, 40 + index * colWidth, currentY, { width: colWidth, ellipsis: true });
      });
      doc.moveDown(0.5);

      // Simple page height check
      if (doc.y > 700) {
        doc.addPage();
        // Re-draw headers on new page
        doc.fontSize(10).font('Helvetica-Bold');
        tableHeaders.forEach((h, i) => {
          doc.text(h, 40 + i * colWidth, 40, { width: colWidth, ellipsis: true });
        });
        doc.moveTo(40, 55).lineTo(560, 55).stroke();
        doc.moveDown(1.5).fontSize(9).font('Helvetica');
      }
    });

    doc.end();
  } catch (err) {
    console.error('PDF Export Error:', err);
    // Cannot return JSON because header is already set, but we end doc
    return;
  }
};
