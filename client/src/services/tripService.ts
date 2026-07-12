import api from "./api"
import { type VehicleData } from "./vehicleService"

export interface DriverData {
  _id?: string;
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string | Date;
  contactNumber: string;
  email?: string;
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
  remarks?: string;
}

export interface TripData {
  _id?: string;
  tripNumber?: string;
  source: string;
  destination: string;
  vehicle: string | VehicleData;
  driver: string | DriverData;
  cargoWeight: number;
  plannedDistance?: number;
  actualDistance?: number;
  plannedStartDate: string | Date;
  actualStartDate?: string | Date;
  completedDate?: string | Date;
  expectedCompletionDate?: string | Date;
  fuelConsumed?: number;
  startingOdometer: number;
  endingOdometer?: number;
  revenue?: number;
  estimatedRevenue?: number;
  status: "Draft" | "Dispatched" | "Completed" | "Cancelled";
  remarks?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  dispatchedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  dispatchedAt?: string | Date;
  completedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  cancelledBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  cancelledAt?: string | Date;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchTripsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicle?: string;
  driver?: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FetchTripsResponse {
  success: boolean;
  message: string;
  data: {
    trips: TripData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleTripResponse {
  success: boolean;
  message: string;
  data: TripData;
}

export interface CompleteTripData {
  endingOdometer: number;
  actualDistance: number;
  fuelConsumed: number;
  completionRemarks?: string;
  completedDate?: string;
}

export interface CancelTripData {
  cancellationReason: string;
}

export const tripService = {
  /**
   * Fetch trips with pagination, sorting, filters, search
   */
  getTrips: async (params?: FetchTripsParams): Promise<FetchTripsResponse> => {
    const response = await api.get<FetchTripsResponse>("/trips", { params })
    return response.data
  },

  /**
   * Fetch a single trip by ID
   */
  getTripById: async (id: string): Promise<SingleTripResponse> => {
    const response = await api.get<SingleTripResponse>(`/trips/${id}`)
    return response.data
  },

  /**
   * Create a new trip (Draft state)
   */
  createTrip: async (data: TripData): Promise<SingleTripResponse> => {
    const response = await api.post<SingleTripResponse>("/trips", data)
    return response.data
  },

  /**
   * Update an existing trip (Allowed only in Draft state)
   */
  updateTrip: async (id: string, data: Partial<TripData>): Promise<SingleTripResponse> => {
    const response = await api.put<SingleTripResponse>(`/trips/${id}`, data)
    return response.data
  },

  /**
   * Delete a trip (Draft or Cancelled states only)
   */
  deleteTrip: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/trips/${id}`)
    return response.data
  },

  /**
   * Dispatch a trip (Draft -> Dispatched)
   */
  dispatchTrip: async (id: string): Promise<SingleTripResponse> => {
    const response = await api.patch<SingleTripResponse>(`/trips/${id}/dispatch`)
    return response.data
  },

  /**
   * Complete a trip (Dispatched -> Completed)
   */
  completeTrip: async (id: string, data: CompleteTripData): Promise<SingleTripResponse> => {
    const response = await api.patch<SingleTripResponse>(`/trips/${id}/complete`, data)
    return response.data
  },

  /**
   * Cancel a trip (Draft or Dispatched -> Cancelled)
   */
  cancelTrip: async (id: string, data: CancelTripData): Promise<SingleTripResponse> => {
    const response = await api.patch<SingleTripResponse>(`/trips/${id}/cancel`, data)
    return response.data
  },

  /**
   * Fetch all available drivers for selection dropdowns
   */
  getAvailableDrivers: async (): Promise<{ success: boolean; message: string; data: DriverData[] }> => {
    const response = await api.get<{ success: boolean; message: string; data: DriverData[] }>("/trips/drivers/available")
    return response.data
  },
}

export default tripService
