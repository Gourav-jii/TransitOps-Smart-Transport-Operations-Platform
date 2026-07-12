import mongoose, { Schema, Document } from 'mongoose';

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface IVehicle {
  registrationNumber: string;
  vehicleName: string;
  model: string;
  manufacturer: string;
  vehicleType: string;
  region?: string;
  maximumLoadCapacity?: number;
  currentOdometer: number;
  acquisitionCost?: number;
  purchaseDate?: Date;
  status: VehicleStatus;
  fuelType?: string;
  insuranceExpiry?: Date;
  fitnessExpiry?: Date;
  pollutionExpiry?: Date;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleName: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Vehicle manufacturer is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    maximumLoadCapacity: {
      type: Number,
      min: [0, 'Maximum load capacity cannot be negative'],
    },
    currentOdometer: {
      type: Number,
      required: [true, 'Current odometer reading is required'],
      min: [0, 'Current odometer reading cannot be negative'],
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      min: [0, 'Acquisition cost cannot be negative'],
    },
    purchaseDate: {
      type: Date,
    },
    status: {
      type: String,
      required: [true, 'Vehicle status is required'],
      enum: {
        values: ['Available', 'On Trip', 'In Shop', 'Retired'],
        message: '{VALUE} is not a valid vehicle status',
      },
      default: 'Available',
    },
    fuelType: {
      type: String,
      trim: true,
    },
    insuranceExpiry: {
      type: Date,
    },
    fitnessExpiry: {
      type: Date,
    },
    pollutionExpiry: {
      type: Date,
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
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ vehicleType: 1 });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
