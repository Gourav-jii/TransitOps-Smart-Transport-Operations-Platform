import mongoose, { Schema, Document } from 'mongoose';

<<<<<<< HEAD
export type NotificationType = 'Alert' | 'System' | 'Maintenance' | 'Compliance';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
=======
export type NotificationType =
  | 'Maintenance Started'
  | 'Maintenance Completed'
  | 'Maintenance Overdue'
  | 'Insurance Expiring'
  | 'Fitness Expiring'
  | 'Pollution Certificate Expiring';

export interface INotification extends Document {
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
<<<<<<< HEAD
=======
  vehicle?: mongoose.Types.ObjectId;
  maintenance?: mongoose.Types.ObjectId;
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
<<<<<<< HEAD
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
    },
=======
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
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
<<<<<<< HEAD
      enum: {
        values: ['Alert', 'System', 'Maintenance', 'Compliance'],
        message: '{VALUE} is not a valid notification type',
      },
      default: 'System',
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
=======
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
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
  },
  {
    timestamps: true,
  }
);

// Indexes
<<<<<<< HEAD
NotificationSchema.index({ recipient: 1 });
=======
>>>>>>> 93ce67f7e092e4676150731e58922b7c30280884
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
