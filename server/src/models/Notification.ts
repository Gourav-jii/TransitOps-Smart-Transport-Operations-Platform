import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'Maintenance Started'
  | 'Maintenance Completed'
  | 'Maintenance Overdue'
  | 'Insurance Expiring'
  | 'Fitness Expiring'
  | 'Pollution Certificate Expiring';

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  vehicle?: mongoose.Types.ObjectId;
  maintenance?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'Maintenance Started',
        'Maintenance Completed',
        'Maintenance Overdue',
        'Insurance Expiring',
        'Fitness Expiring',
        'Pollution Certificate Expiring',
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    maintenance: {
      type: Schema.Types.ObjectId,
      ref: 'MaintenanceLog',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
