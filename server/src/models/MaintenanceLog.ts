import mongoose, { Schema, Document } from 'mongoose';

export type MaintenanceStatus = 'Active' | 'Completed' | 'Cancelled';

export interface IMaintenanceLog extends Document {
  vehicle: mongoose.Types.ObjectId;
  maintenanceType: string;
  description: string;
  vendor: string;
  cost: number;
  startDate: Date;
  endDate?: Date;
  status: MaintenanceStatus;
  invoiceNumber?: string;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceLogSchema = new Schema<IMaintenanceLog>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    maintenanceType: {
      type: String,
      required: [true, 'Maintenance type is required'],
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
    cost: {
      type: Number,
      required: [true, 'Service cost is required'],
      min: [0, 'Service cost cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Active', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid maintenance status',
      },
      default: 'Active',
    },
    invoiceNumber: {
      type: String,
      trim: true,
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
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Indexes
MaintenanceLogSchema.index({ vehicle: 1 });
MaintenanceLogSchema.index({ status: 1 });

export default mongoose.model<IMaintenanceLog>('MaintenanceLog', MaintenanceLogSchema);
