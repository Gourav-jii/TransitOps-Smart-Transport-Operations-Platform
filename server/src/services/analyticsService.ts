import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import MaintenanceLog from '../models/MaintenanceLog';
import FuelLog from '../models/FuelLog';
import Expense from '../models/Expense';
import mongoose from 'mongoose';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  vehicleType?: string;
  region?: string;
}

class AnalyticsService {
  /**
   * Helper to build date and vehicle match query criteria
   */
  private async buildMatchQuery(filters: DashboardFilters, dateField: string) {
    const match: any = {};

    // Date Range Match
    if (filters.startDate || filters.endDate) {
      match[dateField] = {};
      if (filters.startDate) match[dateField].$gte = new Date(filters.startDate);
      if (filters.endDate) match[dateField].$lte = new Date(filters.endDate);
    }

    // Vehicle Type or Region matching
    if (filters.region || filters.vehicleType) {
      const vehQuery: any = {};
      if (filters.region) vehQuery.region = filters.region;
      if (filters.vehicleType) vehQuery.vehicleType = filters.vehicleType;

      const matchingVehicles = await Vehicle.find(vehQuery).select('_id');
      const vehicleIds = matchingVehicles.map((v) => v._id);
      match.vehicle = { $in: vehicleIds };
    }

    return match;
  }

  /**
   * Fetch live KPI cards
   */
  async getDashboardSummary(filters: DashboardFilters) {
    // 1. VEHICLE COUNTS BY STATUS
    const vehicleQuery: any = {};
    if (filters.region) vehicleQuery.region = filters.region;
    if (filters.vehicleType) vehicleQuery.vehicleType = filters.vehicleType;
    
    const vehicleStats = await Vehicle.aggregate([
      { $match: vehicleQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const vehicleCounts = {
      Available: 0,
      'On Trip': 0,
      'In Shop': 0,
      Retired: 0,
      Total: 0,
    };

    vehicleStats.forEach((stat) => {
      const statusKey = stat._id as keyof typeof vehicleCounts;
      if (statusKey in vehicleCounts) {
        vehicleCounts[statusKey] = stat.count;
      }
    });

    const activeVehicles = vehicleCounts['On Trip'] + vehicleCounts['In Shop'];
    const totalNonRetired = vehicleCounts['Available'] + vehicleCounts['On Trip'] + vehicleCounts['In Shop'];
    vehicleCounts.Total = totalNonRetired + vehicleCounts.Retired;

    const fleetUtilization = totalNonRetired > 0 
      ? Number(((vehicleCounts['On Trip'] / totalNonRetired) * 100).toFixed(1))
      : 0;

    // 2. DRIVER COUNTS BY STATUS
    const driverQuery: any = {};
    if (filters.region) driverQuery.region = filters.region;
    const driverStats = await Driver.aggregate([
      { $match: driverQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const driverCounts = {
      Available: 0,
      'On Trip': 0,
      Suspended: 0,
      'Off Duty': 0,
    };

    driverStats.forEach((stat) => {
      const statusKey = stat._id as keyof typeof driverCounts;
      if (statusKey in driverCounts) {
        driverCounts[statusKey] = stat.count;
      }
    });

    // 3. TRIP COUNTS
    const tripMatch = await this.buildMatchQuery(filters, 'plannedStartDate');
    const tripStats = await Trip.aggregate([
      { $match: tripMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const tripCounts = {
      Draft: 0,
      Dispatched: 0,
      Completed: 0,
      Cancelled: 0,
    };

    tripStats.forEach((stat) => {
      const statusKey = stat._id as keyof typeof tripCounts;
      if (statusKey in tripCounts) {
        tripCounts[statusKey] = stat.count;
      }
    });

    // 4. FINANCIAL STATS
    const fuelMatch = await this.buildMatchQuery(filters, 'fuelDate');
    const fuelCostSum = await FuelLog.aggregate([
      { $match: fuelMatch },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);

    const maintMatch = await this.buildMatchQuery(filters, 'createdAt');
    const maintCostSum = await MaintenanceLog.aggregate([
      { $match: maintMatch },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } } } },
    ]);

    const expMatch = await this.buildMatchQuery(filters, 'expenseDate');
    const expCostSum = await Expense.aggregate([
      { $match: expMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const revenueSum = await Trip.aggregate([
      { $match: { ...tripMatch, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]);

    const totalFuelCost = fuelCostSum[0]?.total || 0;
    const totalMaintenanceCost = maintCostSum[0]?.total || 0;
    const totalExpenses = expCostSum[0]?.total || 0;

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;
    const totalRevenue = revenueSum[0]?.total || 0;

    const netProfit = totalRevenue - totalOperationalCost;
    const fleetROI = totalOperationalCost > 0 
      ? Number(((netProfit / totalOperationalCost) * 100).toFixed(1))
      : 0;

    // 5. FUEL EFFICIENCY
    const efficiencySum = await Trip.aggregate([
      { $match: { ...tripMatch, status: 'Completed', fuelConsumed: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: { $ifNull: ['$actualDistance', '$plannedDistance'] } },
          totalFuel: { $sum: '$fuelConsumed' },
        },
      },
    ]);

    const avgFuelEfficiency = efficiencySum[0]?.totalFuel > 0
      ? Number((efficiencySum[0].totalDistance / efficiencySum[0].totalFuel).toFixed(2))
      : 0;

    return {
      vehicles: {
        active: activeVehicles,
        available: vehicleCounts['Available'],
        inMaintenance: vehicleCounts['In Shop'],
        retired: vehicleCounts['Retired'],
        utilizationPercent: fleetUtilization,
      },
      trips: tripCounts,
      drivers: {
        available: driverCounts['Available'],
        onTrip: driverCounts['On Trip'],
        suspended: driverCounts['Suspended'],
      },
      financials: {
        totalFuelCost,
        totalMaintenanceCost,
        totalOperationalCost,
        totalRevenue,
        netProfit,
        fleetROI,
        avgFuelEfficiency,
      },
    };
  }

  /**
   * Fetch charts metrics
   */
  async getDashboardCharts(filters: DashboardFilters) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const tripMatch = await this.buildMatchQuery(filters, 'plannedStartDate');
    const fuelMatch = await this.buildMatchQuery(filters, 'fuelDate');
    const maintMatch = await this.buildMatchQuery(filters, 'createdAt');
    const expMatch = await this.buildMatchQuery(filters, 'expenseDate');

    // 1. MONTHLY TRIPS TREND (Line Chart)
    const monthlyTrips = await Trip.aggregate([
      { $match: { ...tripMatch, plannedStartDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$plannedStartDate' },
            month: { $month: '$plannedStartDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 2. FUEL CONSUMPTION TREND (Line Chart)
    const monthlyFuel = await FuelLog.aggregate([
      { $match: { ...fuelMatch, fuelDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$fuelDate' },
            month: { $month: '$fuelDate' },
          },
          liters: { $sum: '$liters' },
          cost: { $sum: '$cost' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 3. MONTHLY COST BREAKDOWN & REVENUE VS EXPENSE (Bar Charts)
    const monthlyMaint = await MaintenanceLog.aggregate([
      { $match: { ...maintMatch, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          cost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
        },
      },
    ]);

    const monthlyExpenses = await Expense.aggregate([
      { $match: { ...expMatch, expenseDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyRevenue = await Trip.aggregate([
      { $match: { ...tripMatch, status: 'Completed', plannedStartDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$plannedStartDate' },
            month: { $month: '$plannedStartDate' },
          },
          revenue: { $sum: '$revenue' },
        },
      },
    ]);

    // Combine monthly data in memory
    const monthlyMap = new Map<string, any>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - 11 + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, {
        month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        trips: 0,
        fuelLiters: 0,
        fuelCost: 0,
        maintenanceCost: 0,
        otherExpenses: 0,
        totalExpenses: 0,
        revenue: 0,
      });
    }

    // Populate maps
    monthlyTrips.forEach((t) => {
      const key = `${t._id.year}-${String(t._id.month).padStart(2, '0')}`;
      if (monthlyMap.has(key)) monthlyMap.get(key).trips = t.count;
    });

    monthlyFuel.forEach((f) => {
      const key = `${f._id.year}-${String(f._id.month).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        const item = monthlyMap.get(key);
        item.fuelLiters = f.liters;
        item.fuelCost = f.cost;
      }
    });

    monthlyMaint.forEach((m) => {
      const key = `${m._id.year}-${String(m._id.month).padStart(2, '0')}`;
      if (monthlyMap.has(key)) monthlyMap.get(key).maintenanceCost = m.cost;
    });

    monthlyExpenses.forEach((e) => {
      const key = `${e._id.year}-${String(e._id.month).padStart(2, '0')}`;
      if (monthlyMap.has(key)) monthlyMap.get(key).otherExpenses = e.amount;
    });

    monthlyRevenue.forEach((r) => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
      if (monthlyMap.has(key)) monthlyMap.get(key).revenue = r.revenue || 0;
    });

    const monthlyTrends = Array.from(monthlyMap.values()).map((item) => {
      item.totalExpenses = Number((item.fuelCost + item.maintenanceCost + item.otherExpenses).toFixed(2));
      item.fuelLiters = Number(item.fuelLiters.toFixed(1));
      item.fuelCost = Number(item.fuelCost.toFixed(2));
      item.maintenanceCost = Number(item.maintenanceCost.toFixed(2));
      item.otherExpenses = Number(item.otherExpenses.toFixed(2));
      item.revenue = Number(item.revenue.toFixed(2));
      return item;
    });

    // 4. MAINTENANCE DISTRIBUTION (Donut Chart)
    const maintDistribution = await MaintenanceLog.aggregate([
      { $match: maintMatch },
      { $group: { _id: '$maintenanceType', count: { $sum: 1 }, totalCost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } } } },
      { $sort: { count: -1 } },
    ]);

    // 5. TOP FUEL CONSUMING VEHICLES
    const topFuelVehicles = await FuelLog.aggregate([
      { $match: fuelMatch },
      { $group: { _id: '$vehicle', totalLiters: { $sum: '$liters' }, totalCost: { $sum: '$cost' } } },
      { $sort: { totalLiters: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo',
        },
      },
      { $unwind: '$vehicleInfo' },
      {
        $project: {
          registrationNumber: '$vehicleInfo.registrationNumber',
          vehicleName: '$vehicleInfo.vehicleName',
          liters: '$totalLiters',
          cost: '$totalCost',
        },
      },
    ]);

    // 6. VEHICLE ROI RANKING (Horizontal Bar)
    const vehicleRevenue = await Trip.aggregate([
      { $match: { ...tripMatch, status: 'Completed' } },
      { $group: { _id: '$vehicle', totalRevenue: { $sum: '$revenue' } } },
    ]);

    const vehicleFuel = await FuelLog.aggregate([
      { $match: fuelMatch },
      { $group: { _id: '$vehicle', totalCost: { $sum: '$cost' } } },
    ]);

    const vehicleMaint = await MaintenanceLog.aggregate([
      { $match: maintMatch },
      { $group: { _id: '$vehicle', totalCost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } } } },
    ]);

    // Merge vehicle ROIs in memory
    const vehicleRoiMap = new Map<string, any>();
    const allVehiclesList = await Vehicle.find(filters.region ? { region: filters.region } : {}).select('registrationNumber vehicleName');
    
    allVehiclesList.forEach((v) => {
      vehicleRoiMap.set(v._id.toString(), {
        id: v._id,
        registrationNumber: v.registrationNumber,
        vehicleName: v.vehicleName,
        revenue: 0,
        expenses: 0,
        netProfit: 0,
      });
    });

    vehicleRevenue.forEach((r) => {
      const idStr = r._id.toString();
      if (vehicleRoiMap.has(idStr)) vehicleRoiMap.get(idStr).revenue = r.totalRevenue || 0;
    });

    vehicleFuel.forEach((f) => {
      const idStr = f._id.toString();
      if (vehicleRoiMap.has(idStr)) vehicleRoiMap.get(idStr).expenses += f.totalCost || 0;
    });

    vehicleMaint.forEach((m) => {
      const idStr = m._id.toString();
      if (vehicleRoiMap.has(idStr)) vehicleRoiMap.get(idStr).expenses += m.totalCost || 0;
    });

    const vehicleROI = Array.from(vehicleRoiMap.values())
      .map((item) => {
        item.netProfit = Number((item.revenue - item.expenses).toFixed(2));
        item.revenue = Number(item.revenue.toFixed(2));
        item.expenses = Number(item.expenses.toFixed(2));
        return item;
      })
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 10);

    return {
      monthlyTrends,
      maintenanceDistribution: maintDistribution.map((item) => ({
        type: item._id,
        count: item.count,
        cost: Number(item.totalCost.toFixed(2)),
      })),
      topFuelVehicles,
      vehicleROI,
    };
  }

  /**
   * Get 5 most recent activities of all categories
   */
  async getRecentActivities() {
    const recentTrips = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'registrationNumber vehicleName')
      .populate('driver', 'fullName');

    const recentMaintenance = await MaintenanceLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'registrationNumber vehicleName');

    const recentFuelLogs = await FuelLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'registrationNumber vehicleName');

    const recentExpenses = await Expense.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'registrationNumber vehicleName');

    return {
      recentTrips,
      recentMaintenance,
      recentFuelLogs,
      recentExpenses,
    };
  }

  /**
   * Check for expiry items and warning alerts
   */
  async getDashboardAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Expiring Driver Licenses
    const expiringDrivers = await Driver.find({
      licenseExpiry: { $lte: thirtyDaysFromNow },
      status: { $ne: 'Suspended' },
    }).select('fullName employeeId licenseNumber licenseExpiry status');

    // 2. Expiring Vehicle Documents
    const expiringVehicles = await Vehicle.find({
      status: { $ne: 'Retired' },
      $or: [
        { insuranceExpiry: { $lte: thirtyDaysFromNow } },
        { fitnessExpiry: { $lte: thirtyDaysFromNow } },
        { pollutionExpiry: { $lte: thirtyDaysFromNow } },
      ],
    }).select('registrationNumber vehicleName insuranceExpiry fitnessExpiry pollutionExpiry status');

    // 3. Vehicles In Shop
    const vehiclesInShop = await Vehicle.find({ status: 'In Shop' }).select(
      'registrationNumber vehicleName currentOdometer region'
    );

    // 4. Low safety score drivers
    const lowSafetyDrivers = await Driver.find({
      safetyScore: { $lt: 75 },
    }).select('fullName employeeId safetyScore status');

    // 5. High cost maintenance logs (> 1000)
    const highCostMaintenance = await MaintenanceLog.find({
      status: 'Completed',
      actualCost: { $gt: 1000 },
    })
      .sort({ actualCost: -1 })
      .limit(5)
      .populate('vehicle', 'registrationNumber vehicleName');

    return {
      expiringDrivers,
      expiringVehicles,
      vehiclesInShop,
      lowSafetyDrivers,
      highCostMaintenance,
    };
  }
}

export default new AnalyticsService();
