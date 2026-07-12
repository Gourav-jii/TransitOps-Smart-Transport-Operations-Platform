import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelLog extends Document {
  vehicle: mongoose.Types.ObjectId;
  trip?: mongoose.Types.ObjectId;
  fuelDate: Date;
  liters: number;
  cost: number;
  fuelStation: string;
  odometer: number;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FuelLogSchema = new Schema<IFuelLog>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    fuelDate: {
      type: Date,
      required: [true, 'Fuel purchase date is required'],
      default: Date.now,
    },
    liters: {
      type: Number,
      required: [true, 'Fuel liters quantity is required'],
      min: [0, 'Fuel liters quantity cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Fuel purchase cost is required'],
      min: [0, 'Fuel purchase cost cannot be negative'],
    },
    fuelStation: {
      type: String,
      required: [true, 'Fuel station name/location is required'],
      trim: true,
    },
    odometer: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer reading cannot be negative'],
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
FuelLogSchema.index({ vehicle: 1 });
FuelLogSchema.index({ trip: 1 });
FuelLogSchema.index({ fuelDate: -1 });

export default mongoose.model<IFuelLog>('FuelLog', FuelLogSchema);
