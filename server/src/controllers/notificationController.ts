import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Notification from '../models/Notification';
import notificationService from '../services/notificationService';
import mongoose from 'mongoose';

/**
 * Helper to validate Mongoose ObjectId
 */
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Helper to format error responses consistently
 */
const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * @route   GET /api/v1/notifications
 * @desc    Fetch notifications list and unread count
 * @access  Private (All authenticated roles)
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('vehicle', 'registrationNumber vehicleName')
      .populate('maintenance', 'maintenanceId maintenanceType status');

    const unreadCount = await Notification.countDocuments({ isRead: false });

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private (All authenticated roles)
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid notification ID');
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (All authenticated roles)
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        unreadCount: 0,
      },
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   DELETE /api/v1/notifications/delete/:id
 * @desc    Delete notification
 * @access  Private (All Roles)
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid notification ID format');
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: null,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   POST /api/v1/notifications/scan
 * @desc    Manually trigger compliance scan for document expiries and overdue schedules
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const triggerComplianceScan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const result = await notificationService.runDailyComplianceScan();
    if (!result.success) {
      return sendError(res, 500, result.error || 'Compliance scan failed');
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    return res.status(200).json({
      success: true,
      message: `Compliance scan complete. ${result.count} new notifications created.`,
      data: {
        newCount: result.count,
        unreadCount,
      },
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};
