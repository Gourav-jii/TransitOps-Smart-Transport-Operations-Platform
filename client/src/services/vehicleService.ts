import api from "./api"

export interface FetchVehiclesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleType?: string;
  region?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VehicleData {
  _id?: string;
  registrationNumber: string;
  vehicleName: string;
  manufacturer: string;
  model: string;
  vehicleType: string;
  region?: string;
  maximumLoadCapacity?: number;
  currentOdometer: number;
  acquisitionCost?: number;
  purchaseDate?: string | Date;
  status: "Available" | "On Trip" | "In Shop" | "Retired";
  fuelType?: string;
  insuranceExpiry?: string | Date;
  fitnessExpiry?: string | Date;
  pollutionExpiry?: string | Date;
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

export interface FetchVehiclesResponse {
  success: boolean;
  message: string;
  data: {
    vehicles: VehicleData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleVehicleResponse {
  success: boolean;
  message: string;
  data: VehicleData;
}

export const vehicleService = {
  /**
   * Fetch vehicles with search, sort, filter, and pagination
   */
  getVehicles: async (params?: FetchVehiclesParams): Promise<FetchVehiclesResponse> => {
    const response = await api.get<FetchVehiclesResponse>("/vehicles", { params })
    return response.data
  },

  /**
   * Fetch a single vehicle by ID
   */
  getVehicleById: async (id: string): Promise<SingleVehicleResponse> => {
    const response = await api.get<SingleVehicleResponse>(`/vehicles/${id}`)
    return response.data
  },

  /**
   * Register a new vehicle
   */
  createVehicle: async (data: VehicleData): Promise<SingleVehicleResponse> => {
    const response = await api.post<SingleVehicleResponse>("/vehicles", data)
    return response.data
  },

  /**
   * Update an existing vehicle
   */
  updateVehicle: async (id: string, data: Partial<VehicleData>): Promise<SingleVehicleResponse> => {
    const response = await api.put<SingleVehicleResponse>(`/vehicles/${id}`, data)
    return response.data
  },

  /**
   * Delete a vehicle record
   */
  deleteVehicle: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/vehicles/${id}`)
    return response.data
  },
}
export default vehicleService
