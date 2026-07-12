import api from './api';

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus = 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
export type MaintenanceType =
  | 'Oil Change'
  | 'Engine Service'
  | 'Brake Service'
  | 'Tyre Replacement'
  | 'Battery Replacement'
  | 'Insurance Renewal'
  | 'Fitness Renewal'
  | 'Pollution Renewal'
  | 'General Service'
  | 'Repair'
  | 'Emergency Repair'
  | 'Other';

export interface MaintenanceAudit {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: 'Created' | 'Updated' | 'Started' | 'Completed' | 'Cancelled';
  timestamp: string;
  prevStatus?: MaintenanceStatus;
  newStatus: MaintenanceStatus;
}

export interface MaintenanceData {
  _id?: string;
  maintenanceId?: string;
  vehicle: {
    _id: string;
    registrationNumber: string;
    vehicleName: string;
    status: string;
    manufacturer?: string;
    model?: string;
    insuranceExpiry?: string;
    fitnessExpiry?: string;
    pollutionExpiry?: string;
  } | string;
  maintenanceType: MaintenanceType;
  title: string;
  description: string;
  vendor: string;
  technician?: string;
  estimatedCost: number;
  actualCost?: number;
  scheduledDate?: string;
  startDate?: string;
  endDate?: string;
  priority: MaintenancePriority;
  invoiceNumber?: string;
  status: MaintenanceStatus;
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
  auditHistory?: MaintenanceAudit[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchMaintenanceParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  maintenanceType?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MaintenanceResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class MaintenanceService {
  async getMaintenanceLogs(params?: FetchMaintenanceParams) {
    const response = await api.get<MaintenanceResponse<{
      maintenanceLogs: MaintenanceData[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>>('/maintenance', { params });
    return response.data;
  }

  async getMaintenanceLogById(id: string) {
    const response = await api.get<MaintenanceResponse<MaintenanceData>>(`/maintenance/${id}`);
    return response.data;
  }

  async createMaintenance(data: Partial<MaintenanceData>) {
    const response = await api.post<MaintenanceResponse<MaintenanceData>>('/maintenance', data);
    return response.data;
  }

  async updateMaintenance(id: string, data: Partial<MaintenanceData>) {
    const response = await api.put<MaintenanceResponse<MaintenanceData>>(`/maintenance/${id}`, data);
    return response.data;
  }

  async deleteMaintenance(id: string) {
    const response = await api.delete<MaintenanceResponse<{ id: string }>>(`/maintenance/${id}`);
    return response.data;
  }

  async startMaintenance(id: string) {
    const response = await api.patch<MaintenanceResponse<MaintenanceData>>(`/maintenance/${id}/start`);
    return response.data;
  }

  async completeMaintenance(id: string, data: { actualCost: number; invoiceNumber?: string; remarks?: string }) {
    const response = await api.patch<MaintenanceResponse<MaintenanceData>>(`/maintenance/${id}/complete`, data);
    return response.data;
  }

  async cancelMaintenance(id: string) {
    const response = await api.patch<MaintenanceResponse<MaintenanceData>>(`/maintenance/${id}/cancel`);
    return response.data;
  }
}

export default new MaintenanceService();
