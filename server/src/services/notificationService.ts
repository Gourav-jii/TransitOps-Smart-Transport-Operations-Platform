import Notification, { NotificationType } from '../models/Notification';
import Vehicle from '../models/Vehicle';
import MaintenanceLog from '../models/MaintenanceLog';
import mongoose from 'mongoose';

class NotificationService {
  /**
   * Helper to create a single notification
   */
  async createNotification(params: {
    title: string;
    message: string;
    type: NotificationType;
    vehicleId?: string | mongoose.Types.ObjectId;
    maintenanceId?: string | mongoose.Types.ObjectId;
  }) {
    try {
      const notification = await Notification.create({
        title: params.title,
        message: params.message,
        type: params.type,
        vehicle: params.vehicleId,
        maintenance: params.maintenanceId,
        isRead: false,
      });
      return { success: true, notification };
    } catch (error) {
      console.error('Error creating notification:', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Scans database to detect certificate expiries and overdue maintenance logs.
   * Runs atomically to prevent generating duplicate unread notifications.
   */
  async runDailyComplianceScan() {
    try {
      console.log('[Compliance Scan] Initiating automated fleet compliance audit scan...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let notificationsCount = 0;

      // 1. SCAN VEHICLES FOR CERTIFICATE EXPIRIES (Insurance, Fitness, Pollution)
      const vehicles = await Vehicle.find({ status: { $ne: 'Retired' } });
      for (const vehicle of vehicles) {
        // Insurance Expiry check
        if (vehicle.insuranceExpiry) {
          const insExpiry = new Date(vehicle.insuranceExpiry);
          if (insExpiry <= thirtyDaysFromNow) {
            const daysLeft = Math.ceil((insExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            const hasExisting = await Notification.findOne({
              vehicle: vehicle._id,
              type: 'Insurance Expiring',
              isRead: false,
            });

            if (!hasExisting) {
              const msg = daysLeft < 0
                ? `Insurance for vehicle ${vehicle.registrationNumber} has EXPIRED on ${insExpiry.toLocaleDateString()}.`
                : `Insurance for vehicle ${vehicle.registrationNumber} is expiring in ${daysLeft} days (${insExpiry.toLocaleDateString()}).`;
              
              await this.createNotification({
                title: 'Insurance Expiry Alert',
                message: msg,
                type: 'Insurance Expiring',
                vehicleId: vehicle._id,
              });
              notificationsCount++;
            }
          }
        }

        // Fitness Expiry check
        if (vehicle.fitnessExpiry) {
          const fitExpiry = new Date(vehicle.fitnessExpiry);
          if (fitExpiry <= thirtyDaysFromNow) {
            const daysLeft = Math.ceil((fitExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            const hasExisting = await Notification.findOne({
              vehicle: vehicle._id,
              type: 'Fitness Expiring',
              isRead: false,
            });

            if (!hasExisting) {
              const msg = daysLeft < 0
                ? `Fitness certification for vehicle ${vehicle.registrationNumber} has EXPIRED on ${fitExpiry.toLocaleDateString()}.`
                : `Fitness certification for vehicle ${vehicle.registrationNumber} is expiring in ${daysLeft} days (${fitExpiry.toLocaleDateString()}).`;
              
              await this.createNotification({
                title: 'Fitness Certificate Alert',
                message: msg,
                type: 'Fitness Expiring',
                vehicleId: vehicle._id,
              });
              notificationsCount++;
            }
          }
        }

        // Pollution Expiry check
        if (vehicle.pollutionExpiry) {
          const polExpiry = new Date(vehicle.pollutionExpiry);
          if (polExpiry <= thirtyDaysFromNow) {
            const daysLeft = Math.ceil((polExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            const hasExisting = await Notification.findOne({
              vehicle: vehicle._id,
              type: 'Pollution Certificate Expiring',
              isRead: false,
            });

            if (!hasExisting) {
              const msg = daysLeft < 0
                ? `Pollution certificate for vehicle ${vehicle.registrationNumber} has EXPIRED on ${polExpiry.toLocaleDateString()}.`
                : `Pollution certificate for vehicle ${vehicle.registrationNumber} is expiring in ${daysLeft} days (${polExpiry.toLocaleDateString()}).`;
              
              await this.createNotification({
                title: 'Pollution Certificate Alert',
                message: msg,
                type: 'Pollution Certificate Expiring',
                vehicleId: vehicle._id,
              });
              notificationsCount++;
            }
          }
        }
      }

      // 2. SCAN SCHEDULED MAINTENANCE FOR OVERDUE TASKS
      const overdueTasks = await MaintenanceLog.find({
        status: 'Scheduled',
        scheduledDate: { $lt: today },
      }).populate('vehicle');

      for (const task of overdueTasks) {
        const hasExisting = await Notification.findOne({
          maintenance: task._id,
          type: 'Maintenance Overdue',
          isRead: false,
        });

        if (!hasExisting) {
          const vNum = (task.vehicle as any)?.registrationNumber || 'Unknown';
          const schedDateStr = task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'N/A';
          await this.createNotification({
            title: 'Maintenance Task Overdue',
            message: `Scheduled ${task.maintenanceType} (${task.maintenanceId}) for vehicle ${vNum} was due on ${schedDateStr}.`,
            type: 'Maintenance Overdue',
            vehicleId: task.vehicle._id,
            maintenanceId: task._id,
          });
          notificationsCount++;
        }
      }

      console.log(`[Compliance Scan] Scan complete. Generated ${notificationsCount} new compliance notifications.`);
      return { success: true, count: notificationsCount };
    } catch (error) {
      console.error('[Compliance Scan] Error running scan:', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new NotificationService();
