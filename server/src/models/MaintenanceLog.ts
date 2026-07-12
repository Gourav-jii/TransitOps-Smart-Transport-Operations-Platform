import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

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

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus = 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';

export interface IMaintenanceAudit {
  user: mongoose.Types.ObjectId;
  action: 'Created' | 'Updated' | 'Started' | 'Completed' | 'Cancelled';
  timestamp: Date;
  prevStatus?: MaintenanceStatus;
  newStatus: MaintenanceStatus;
}

export interface IMaintenanceLog extends Document {
  maintenanceId: string;
  vehicle: mongoose.Types.ObjectId;
  maintenanceType: MaintenanceType;
  title: string;
  description: string;
  vendor: string;
  technician?: string;
  estimatedCost: number;
  actualCost?: number;
  scheduledDate?: Date;
  startDate?: Date;
  endDate?: Date;
  priority: MaintenancePriority;
  invoiceNumber?: string;
  status: MaintenanceStatus;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  auditHistory: IMaintenanceAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceAuditSchema = new Schema<IMaintenanceAudit>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['Created', 'Updated', 'Started', 'Completed', 'Cancelled'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  prevStatus: {
    type: String,
    enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
  },
  newStatus: {
    type: String,
    enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
    required: true,
  },
});

const MaintenanceLogSchema = new Schema<IMaintenanceLog>(
  {
    maintenanceId: {
      type: String,
      unique: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    maintenanceType: {
      type: String,
      required: [true, 'Maintenance type is required'],
      enum: {
        values: [
          'Oil Change',
          'Engine Service',
          'Brake Service',
          'Tyre Replacement',
          'Battery Replacement',
          'Insurance Renewal',
          'Fitness Renewal',
          'Pollution Renewal',
          'General Service',
          'Repair',
          'Emergency Repair',
          'Other',
        ],
        message: '{VALUE} is not a valid maintenance type',
      },
    },
    title: {
      type: String,
      required: [true, 'Maintenance title/subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true,
    },
    vendor: {
      type: String,
      required: [true, 'Service vendor is required'],
      trim: true,
    },
    technician: {
      type: String,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Estimated cost cannot be negative'],
    },
    actualCost: {
      type: Number,
      min: [0, 'Actual cost cannot be negative'],
    },
    scheduledDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: String,
      required: [true, 'Priority level is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    auditHistory: [MaintenanceAuditSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Pre-save hook to auto-generate unique Maintenance ID (e.g. MNT-000001)
MaintenanceLogSchema.pre<IMaintenanceLog>('save', async function (next) {
  const log = this;

  if (!log.isNew) {
    return next();
  }

  try {
    const session = log.$session();
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'MaintenanceLog' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, session }
    );

    const sequenceString = String(counter.sequenceValue).padStart(6, '0');
    log.maintenanceId = `MNT-${sequenceString}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
MaintenanceLogSchema.index({ vehicle: 1 });
MaintenanceLogSchema.index({ status: 1 });
MaintenanceLogSchema.index({ priority: 1 });
MaintenanceLogSchema.index({ scheduledDate: 1 });

export default mongoose.model<IMaintenanceLog>('MaintenanceLog', MaintenanceLogSchema);
