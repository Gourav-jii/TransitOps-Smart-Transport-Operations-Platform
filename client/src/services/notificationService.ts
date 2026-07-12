import api from "./api"

export interface NotificationData {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: "Alert" | "System" | "Maintenance" | "Compliance";
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

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
