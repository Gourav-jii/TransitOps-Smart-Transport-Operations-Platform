import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface IFuelLog extends Document {
  fuelLogId: string;
  vehicle: mongoose.Types.ObjectId;
  trip?: mongoose.Types.ObjectId;
  fuelDate: Date;
  liters: number;
  cost: number;
  pricePerLiter: number;
  fuelStation: string;
  odometer: number;
  paymentMethod: string;
  receiptNumber?: string;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FuelLogSchema = new Schema<IFuelLog>(
  {
    fuelLogId: {
      type: String,
      unique: true,
      trim: true,
    },
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
    pricePerLiter: {
      type: Number,
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
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
    },
    receiptNumber: {
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

// Pre-save hook to generate unique Fuel Log ID and calculate price per liter
FuelLogSchema.pre<IFuelLog>('save', async function (next) {
  const log = this;

  // Auto calculate price per liter
  if (log.liters > 0) {
    log.pricePerLiter = Number((log.cost / log.liters).toFixed(3));
  } else {
    log.pricePerLiter = 0;
  }

  if (!log.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'FuelLog' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    const sequenceString = String(counter.sequenceValue).padStart(6, '0');
    log.fuelLogId = `FUEL-${sequenceString}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
FuelLogSchema.index({ vehicle: 1 });
FuelLogSchema.index({ trip: 1 });
FuelLogSchema.index({ fuelDate: -1 });

export default mongoose.model<IFuelLog>('FuelLog', FuelLogSchema);
