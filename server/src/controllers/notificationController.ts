import { Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import notificationService from '../services/notificationService';
import { AuthRequest } from '../middlewares/authMiddleware';

const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user's notifications + system notifications
 * @access  Private (All Roles)
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    const notifications = await Notification.find({
      $or: [
        { recipient: req.user._id },
        { recipient: { $exists: false } },
        { recipient: null },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('vehicle', 'registrationNumber vehicleName')
      .populate('maintenance', 'maintenanceId maintenanceType status');

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    });
  } catch (error) {
    console.error('Fetch Notifications Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching notifications', [(error as Error).message]);
  }
};

/**
 * @route   PATCH /api/v1/notifications/read
 * @desc    Mark notifications as read (single if id passed, else all)
 * @access  Private (All Roles)
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    const { id } = req.body;

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendError(res, 400, 'Invalid notification ID format');
      }
      
      const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return sendError(res, 404, 'Notification not found or access denied');
      }
    } else {
      // Mark all as read if no ID provided
      await Notification.updateMany(
        {
          $or: [
            { recipient: req.user._id },
            { recipient: { $exists: false } },
            { recipient: null },
          ],
          isRead: false,
        },
        { isRead: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: id ? 'Notification marked as read' : 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark Notifications Read Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating notifications', [(error as Error).message]);
  }
};

/**
 * @route   DELETE /api/v1/notifications/delete/:id
 * @desc    Delete notification
 * @access  Private (All Roles)
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid notification ID format');
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return sendError(res, 404, 'Notification not found or access denied');
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete Notification Error:', (error as Error).message);
    return sendError(res, 500, 'Server error deleting notification', [(error as Error).message]);
  }
};

/**
 * @route   POST /api/v1/notifications/scan
 * @desc    Trigger automated compliance scan
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const triggerComplianceScan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    const result = await notificationService.runDailyComplianceScan();
    if (!result.success) {
      return sendError(res, 500, result.error || 'Compliance scan failed');
    }

    return res.status(200).json({
      success: true,
      message: `Compliance scan complete. ${result.count} new notifications created.`,
      data: {
        newCount: result.count,
      },
    });
  } catch (error) {
    console.error('Compliance Scan Error:', (error as Error).message);
    return sendError(res, 500, 'Server error during compliance scan', [(error as Error).message]);
  }
};
