import api from './api';

export interface NotificationData {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  vehicle?: {
    _id: string;
    registrationNumber: string;
    vehicleName: string;
  };
  maintenance?: {
    _id: string;
    maintenanceId: string;
    maintenanceType: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: NotificationData[];
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

export interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    newCount: number;
  };
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationResponse> => {
    const response = await api.get<NotificationResponse>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<MarkReadResponse> => {
    const response = await api.patch<MarkReadResponse>(`/notifications/read`, { id });
    return response.data;
  },

  markAllAsRead: async (): Promise<MarkReadResponse> => {
    const response = await api.patch<MarkReadResponse>('/notifications/read');
    return response.data;
  },

  deleteNotification: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/notifications/delete/${id}`);
    return response.data;
  },

  triggerComplianceScan: async (): Promise<ScanResponse> => {
    const response = await api.post<ScanResponse>('/notifications/scan');
    return response.data;
  },
};

export default notificationService;
