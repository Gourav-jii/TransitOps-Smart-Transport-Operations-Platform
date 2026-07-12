import api from "./api"

export interface FleetReportData {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  completedTrips: number;
  totalDistance: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalRevenue: number;
}

export interface VehicleReportItem {
  vehicleId: string;
  name: string;
  type: string;
  region: string;
  status: string;
  tripsCompleted: number;
  distanceCovered: number;
  fuelCost: number;
  maintenanceCost: number;
  totalExpense: number;
  roi: number;
}

export interface DriverReportItem {
  driverId: string;
  name: string;
  status: string;
  licenseExpiry: string;
  tripsCompleted: number;
  safetyScore: number;
}

export interface TripReportItem {
  tripNumber: string;
  source: string;
  destination: string;
  vehiclePlate: string;
  driverName: string;
  distance: number;
  fuelUsed: number;
  revenue: number;
  status: string;
}

export interface MaintenanceReportItem {
  maintenanceId: string;
  vehiclePlate: string;
  serviceType: string;
  cost: number;
  vendor: string;
  status: string;
  scheduledDate: string;
  completedDate?: string;
}

export interface FuelReportItem {
  fuelLogId: string;
  vehiclePlate: string;
  tripNumber: string;
  liters: number;
  cost: number;
  pricePerLiter: number;
  fuelStation: string;
  fuelDate: string;
}

export interface ExpenseReportItem {
  expenseId: string;
  vehiclePlate: string;
  expenseType: string;
  amount: number;
  vendor: string;
  expenseDate: string;
  description: string;
}

export interface FinancialReportData {
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  netProfit: number;
}

export interface RoiReportItem {
  vehiclePlate: string;
  vehicleName: string;
  acquisitionCost: number;
  revenue: number;
  opex: number;
  profit: number;
  roiPercent: number;
}

export const reportService = {
  getFleetReport: async (params?: any): Promise<{ success: boolean; data: FleetReportData }> => {
    const res = await api.get("/reports/fleet", { params })
    return res.data
  },

  getVehiclesReport: async (params?: any): Promise<{ success: boolean; data: VehicleReportItem[] }> => {
    const res = await api.get("/reports/vehicles", { params })
    return res.data
  },

  getDriversReport: async (params?: any): Promise<{ success: boolean; data: DriverReportItem[] }> => {
    const res = await api.get("/reports/drivers", { params })
    return res.data
  },

  getTripsReport: async (params?: any): Promise<{ success: boolean; data: TripReportItem[] }> => {
    const res = await api.get("/reports/trips", { params })
    return res.data
  },

  getMaintenanceReport: async (params?: any): Promise<{ success: boolean; data: MaintenanceReportItem[] }> => {
    const res = await api.get("/reports/maintenance", { params })
    return res.data
  },

  getFuelReport: async (params?: any): Promise<{ success: boolean; data: FuelReportItem[] }> => {
    const res = await api.get("/reports/fuel", { params })
    return res.data
  },

  getExpensesReport: async (params?: any): Promise<{ success: boolean; data: ExpenseReportItem[] }> => {
    const res = await api.get("/reports/expenses", { params })
    return res.data
  },

  getFinancialReport: async (params?: any): Promise<{ success: boolean; data: FinancialReportData }> => {
    const res = await api.get("/reports/financial", { params })
    return res.data
  },

  getRoiReport: async (params?: any): Promise<{ success: boolean; data: RoiReportItem[] }> => {
    const res = await api.get("/reports/roi", { params })
    return res.data
  },

  exportCSV: async (reportType: string, params?: any): Promise<void> => {
    const response = await api.get("/reports/export/csv", {
      params: { ...params, reportType },
      responseType: "blob",
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${reportType}-report-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  exportPDF: async (reportType: string, params?: any): Promise<void> => {
    const response = await api.get("/reports/export/pdf", {
      params: { ...params, reportType },
      responseType: "blob",
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${reportType}-report-${Date.now()}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

export default reportService
