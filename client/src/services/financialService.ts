import api from "./api"
import { type VehicleData } from "./vehicleService"
import { type TripData } from "./tripService"

export interface FuelLogData {
  _id?: string;
  fuelLogId?: string;
  vehicle: string | VehicleData;
  trip?: string | TripData;
  fuelDate: string | Date;
  liters: number;
  cost: number;
  pricePerLiter?: number;
  fuelStation: string;
  odometer: number;
  paymentMethod: string;
  receiptNumber?: string;
  remarks?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseData {
  _id?: string;
  expenseId?: string;
  vehicle?: string | VehicleData;
  trip?: string | TripData;
  expenseType: 'Fuel' | 'Maintenance' | 'Toll' | 'Parking' | 'Repair' | 'Insurance' | 'Tax' | 'Fine' | 'Other';
  amount: number;
  expenseDate: string | Date;
  vendor: string;
  description: string;
  receiptNumber?: string;
  remarks?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchFinancialsParams {
  page?: number;
  limit?: number;
  search?: string;
  vehicle?: string;
  trip?: string;
  expenseType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FetchFuelLogsResponse {
  success: boolean;
  message: string;
  data: {
    fuelLogs: FuelLogData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface FetchExpensesResponse {
  success: boolean;
  message: string;
  data: {
    expenses: ExpenseData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleFuelResponse {
  success: boolean;
  message: string;
  data: FuelLogData;
}

export interface SingleExpenseResponse {
  success: boolean;
  message: string;
  data: ExpenseData;
}

export interface VehicleFinancialSummaryResponse {
  success: boolean;
  message: string;
  data: {
    vehicle: {
      _id: string;
      registrationNumber: string;
      vehicleName: string;
      acquisitionCost: number;
    };
    metrics: {
      totalFuelCost: number;
      totalMaintenanceCost: number;
      otherExpensesCost: number;
      operationalCost: number;
      totalRevenue: number;
      netProfit: number;
      totalDistance: number;
      totalFuelConsumed: number;
      fuelEfficiency: number;
      costPerKm: number;
      roi: number;
    };
  };
}

export const financialService = {
  // Fuel Logs CRUD
  getFuelLogs: async (params?: FetchFinancialsParams): Promise<FetchFuelLogsResponse> => {
    const response = await api.get<FetchFuelLogsResponse>("/fuel", { params })
    return response.data
  },

  getFuelLogById: async (id: string): Promise<SingleFuelResponse> => {
    const response = await api.get<SingleFuelResponse>(`/fuel/${id}`)
    return response.data
  },

  createFuelLog: async (data: FuelLogData): Promise<SingleFuelResponse> => {
    const response = await api.post<SingleFuelResponse>("/fuel", data)
    return response.data
  },

  updateFuelLog: async (id: string, data: Partial<FuelLogData>): Promise<SingleFuelResponse> => {
    const response = await api.put<SingleFuelResponse>(`/fuel/${id}`, data)
    return response.data
  },

  deleteFuelLog: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/fuel/${id}`)
    return response.data
  },

  // Expenses CRUD
  getExpenses: async (params?: FetchFinancialsParams): Promise<FetchExpensesResponse> => {
    const response = await api.get<FetchExpensesResponse>("/expenses", { params })
    return response.data
  },

  getExpenseById: async (id: string): Promise<SingleExpenseResponse> => {
    const response = await api.get<SingleExpenseResponse>(`/expenses/${id}`)
    return response.data
  },

  createExpense: async (data: ExpenseData): Promise<SingleExpenseResponse> => {
    const response = await api.post<SingleExpenseResponse>("/expenses", data)
    return response.data
  },

  updateExpense: async (id: string, data: Partial<ExpenseData>): Promise<SingleExpenseResponse> => {
    const response = await api.put<SingleExpenseResponse>(`/expenses/${id}`, data)
    return response.data
  },

  deleteExpense: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/expenses/${id}`)
    return response.data
  },

  // Vehicle Financial summary calculation
  getVehicleFinancialSummary: async (vehicleId: string): Promise<VehicleFinancialSummaryResponse> => {
    const response = await api.get<VehicleFinancialSummaryResponse>(`/analytics/vehicle/${vehicleId}/financial-summary`)
    return response.data
  },
}

export default financialService
