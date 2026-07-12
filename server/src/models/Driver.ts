import mongoose, { Schema, Document } from 'mongoose';

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface IDriver extends Document {
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  contactNumber: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  joiningDate?: Date;
  safetyScore: number;
  status: DriverStatus;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    fullName: {
      type: String,
      required: [true, 'Driver full name is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseCategory: {
      type: String,
      required: [true, 'License category is required'],
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    safetyScore: {
      type: Number,
      min: [0, 'Safety score cannot be negative'],
      max: [100, 'Safety score cannot exceed 100'],
      default: 100,
    },
    status: {
      type: String,
      required: [true, 'Driver status is required'],
      enum: {
        values: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
        message: '{VALUE} is not a valid driver status',
      },
      default: 'Available',
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
DriverSchema.index({ status: 1 });
DriverSchema.index({ licenseExpiry: 1 });

export default mongoose.model<IDriver>('Driver', DriverSchema);
