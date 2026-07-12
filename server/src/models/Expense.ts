import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseType = 'Fuel' | 'Maintenance' | 'Toll' | 'Parking' | 'Repair' | 'Other';

export interface IExpense extends Document {
  vehicle?: mongoose.Types.ObjectId;
  trip?: mongoose.Types.ObjectId;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: Date;
  description: string;
  receiptNumber?: string;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
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
        values: ['Fuel', 'Maintenance', 'Toll', 'Parking', 'Repair', 'Other'],
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

// Indexes
ExpenseSchema.index({ vehicle: 1 });
ExpenseSchema.index({ trip: 1 });
ExpenseSchema.index({ expenseType: 1 });
ExpenseSchema.index({ expenseDate: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
