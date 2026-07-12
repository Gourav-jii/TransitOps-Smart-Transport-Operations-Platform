<<<<<<< HEAD
import api from "./api"

export interface NotificationData {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: "Alert" | "System" | "Maintenance" | "Compliance";
  isRead: boolean;
=======
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
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
  createdAt: string;
  updatedAt: string;
}

<<<<<<< HEAD
export const notificationService = {
  getNotifications: async (): Promise<{ success: boolean; data: NotificationData[] }> => {
    const res = await api.get<{ success: boolean; data: NotificationData[] }>("/notifications")
    return res.data
  },

  markAsRead: async (id?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch<{ success: boolean; message: string }>("/notifications/read", { id })
    return res.data
  },

  deleteNotification: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/notifications/delete/${id}`)
    return res.data
  },
}

export default notificationService
=======
export interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    notifications: NotificationData[];
    unreadCount: number;
  };
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  data: {
    notification: NotificationData;
    unreadCount: number;
  };
}

export interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    newCount: number;
    unreadCount: number;
  };
}

class NotificationService {
  async getNotifications() {
    const response = await api.get<NotificationResponse>('/notifications');
    return response.data;
  }

  async markAsRead(id: string) {
    const response = await api.patch<MarkReadResponse>(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await api.patch<{ success: boolean; message: string; data: { unreadCount: number } }>('/notifications/read-all');
    return response.data;
  }

  async triggerComplianceScan() {
    const response = await api.post<ScanResponse>('/notifications/scan');
    return response.data;
  }
}

export default new NotificationService();
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
