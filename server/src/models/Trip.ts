import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface ITrip extends Document {
  tripNumber: string;
  source: string;
  destination: string;
  vehicle: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  cargoWeight: number;
  plannedDistance?: number;
  actualDistance?: number;
  plannedStartDate: Date;
  actualStartDate?: Date;
  completedDate?: Date;
  fuelConsumed?: number;
  startingOdometer: number;
  endingOdometer?: number;
  revenue?: number;
  status: TripStatus;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    tripNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'Trip source location is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Trip destination location is required'],
      trim: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Assigned Vehicle ID is required'],
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Assigned Driver ID is required'],
    },
    cargoWeight: {
      type: Number,
      required: [true, 'Cargo weight is required'],
      min: [0, 'Cargo weight cannot be negative'],
    },
    plannedDistance: {
      type: Number,
      min: [0, 'Planned distance cannot be negative'],
    },
    actualDistance: {
      type: Number,
      min: [0, 'Actual distance cannot be negative'],
    },
    plannedStartDate: {
      type: Date,
      required: [true, 'Planned start date is required'],
    },
    actualStartDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    fuelConsumed: {
      type: Number,
      min: [0, 'Fuel consumed cannot be negative'],
    },
    startingOdometer: {
      type: Number,
      required: [true, 'Starting odometer reading is required'],
      min: [0, 'Starting odometer reading cannot be negative'],
    },
    endingOdometer: {
      type: Number,
      min: [0, 'Ending odometer reading cannot be negative'],
    },
    revenue: {
      type: Number,
      min: [0, 'Trip revenue cannot be negative'],
    },
    status: {
      type: String,
      required: [true, 'Trip status is required'],
      enum: {
        values: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid trip status',
      },
      default: 'Draft',
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

// Pre-save hook to auto-generate unique trip number (e.g. TRIP-000001)
TripSchema.pre<ITrip>('save', async function (next) {
  const trip = this;
  
  if (!trip.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'Trip' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    const sequenceString = String(counter.sequenceValue).padStart(6, '0');
    trip.tripNumber = `TRIP-${sequenceString}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
TripSchema.index({ status: 1 });
TripSchema.index({ vehicle: 1 });
TripSchema.index({ driver: 1 });

export default mongoose.model<ITrip>('Trip', TripSchema);
