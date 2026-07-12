import api from './api';

export interface DashboardParams {
  startDate?: string;
  endDate?: string;
  vehicleType?: string;
  region?: string;
}

export interface SummaryData {
  vehicles: {
    active: number;
    available: number;
    inMaintenance: number;
    retired: number;
    utilizationPercent: number;
  };
  trips: {
    Draft: number;
    Dispatched: number;
    Completed: number;
    Cancelled: number;
  };
  drivers: {
    available: number;
    onTrip: number;
    suspended: number;
  };
  financials: {
    totalFuelCost: number;
    totalMaintenanceCost: number;
    totalOperationalCost: number;
    totalRevenue: number;
    netProfit: number;
    fleetROI: number;
    avgFuelEfficiency: number;
  };
}

export interface ChartData {
  monthlyTrends: Array<{
    month: string;
    trips: number;
    fuelLiters: number;
    fuelCost: number;
    maintenanceCost: number;
    otherExpenses: number;
    totalExpenses: number;
    revenue: number;
  }>;
  maintenanceDistribution: Array<{
    type: string;
    count: number;
    cost: number;
  }>;
  topFuelVehicles: Array<{
    _id: string;
    registrationNumber: string;
    vehicleName: string;
    liters: number;
    cost: number;
  }>;
  vehicleROI: Array<{
    id: string;
    registrationNumber: string;
    vehicleName: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
}

export interface RecentActivitiesData {
  recentTrips: any[];
  recentMaintenance: any[];
  recentFuelLogs: any[];
  recentExpenses: any[];
}

export interface AlertData {
  expiringDrivers: any[];
  expiringVehicles: any[];
  vehiclesInShop: any[];
  lowSafetyDrivers: any[];
  highCostMaintenance: any[];
}

const dashboardService = {
  getSummary: (params?: DashboardParams) => {
    return api.get<{ success: boolean; data: SummaryData }>('/dashboard/summary', { params });
  },

  getCharts: (params?: DashboardParams) => {
    return api.get<{ success: boolean; data: ChartData }>('/dashboard/charts', { params });
  },

  getRecentActivities: () => {
    return api.get<{ success: boolean; data: RecentActivitiesData }>('/dashboard/recent-activities');
  },

  getAlerts: () => {
    return api.get<{ success: boolean; data: AlertData }>('/dashboard/alerts');
  },
};

export default dashboardService;
