import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export type ExpenseType =
  | 'Fuel'
  | 'Maintenance'
  | 'Toll'
  | 'Parking'
  | 'Repair'
  | 'Insurance'
  | 'Tax'
  | 'Fine'
  | 'Other';

export interface IExpense extends Document {
  expenseId: string;
  vehicle?: mongoose.Types.ObjectId;
  trip?: mongoose.Types.ObjectId;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: Date;
  vendor: string;
  description: string;
  receiptNumber?: string;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseId: {
      type: String,
      unique: true,
      trim: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    expenseType: {
      type: String,
      required: [true, 'Expense category type is required'],
      enum: {
        values: [
          'Fuel',
          'Maintenance',
          'Toll',
          'Parking',
          'Repair',
          'Insurance',
          'Tax',
          'Fine',
          'Other',
        ],
        message: '{VALUE} is not a valid expense type',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount cannot be negative'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense occurrence date is required'],
      default: Date.now,
    },
    vendor: {
      type: String,
      required: [true, 'Expense vendor is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
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

// Pre-save hook to generate unique Expense ID
ExpenseSchema.pre<IExpense>('save', async function (next) {
  const expense = this;

  if (!expense.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'Expense' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    const sequenceString = String(counter.sequenceValue).padStart(6, '0');
    expense.expenseId = `EXP-${sequenceString}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
ExpenseSchema.index({ vehicle: 1 });
ExpenseSchema.index({ trip: 1 });
ExpenseSchema.index({ expenseType: 1 });
ExpenseSchema.index({ expenseDate: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
