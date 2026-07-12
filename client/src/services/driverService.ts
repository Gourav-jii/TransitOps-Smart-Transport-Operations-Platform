import api from "./api"

export interface FetchDriversParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  region?: string;
  licenseCategory?: string;
  minSafetyScore?: number;
  maxSafetyScore?: number;
  expiringSoon?: boolean | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DriverData {
  _id?: string;
  employeeId?: string;
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string | Date;
  contactNumber: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  joiningDate?: string | Date;
  safetyScore: number;
  experience: number;
  region?: string;
  remarks?: string;
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchDriversResponse {
  success: boolean;
  message: string;
  data: {
    drivers: DriverData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleDriverResponse {
  success: boolean;
  message: string;
  data: DriverData;
}

export const driverService = {
  /**
   * Fetch drivers list with search, sort, filter, and pagination
   */
  getDrivers: async (params?: FetchDriversParams): Promise<FetchDriversResponse> => {
    const response = await api.get<FetchDriversResponse>("/drivers", { params })
    return response.data
  },

  /**
   * Fetch a single driver by ID
   */
  getDriverById: async (id: string): Promise<SingleDriverResponse> => {
    const response = await api.get<SingleDriverResponse>(`/drivers/${id}`)
    return response.data
  },

  /**
   * Register a new driver profile
   */
  createDriver: async (data: DriverData): Promise<SingleDriverResponse> => {
    const response = await api.post<SingleDriverResponse>("/drivers", data)
    return response.data
  },

  /**
   * Update an existing driver's profile
   */
  updateDriver: async (id: string, data: Partial<DriverData>): Promise<SingleDriverResponse> => {
    const response = await api.put<SingleDriverResponse>(`/drivers/${id}`, data)
    return response.data
  },

  /**
   * Delete a driver record
   */
  deleteDriver: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/drivers/${id}`)
    return response.data
  },

  /**
   * Update driver duty status directly
   */
  updateDriverStatus: async (id: string, status: string): Promise<SingleDriverResponse> => {
    const response = await api.patch<SingleDriverResponse>(`/drivers/${id}/status`, { status })
    return response.data
  },

  /**
   * Update driver safety score directly
   */
  updateDriverSafetyScore: async (id: string, safetyScore: number): Promise<SingleDriverResponse> => {
    const response = await api.patch<SingleDriverResponse>(`/drivers/${id}/safety-score`, { safetyScore })
    return response.data
  },
}

export default driverService
