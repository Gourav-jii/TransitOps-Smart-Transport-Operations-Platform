import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  modelName: string;
  sequenceValue: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    modelName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sequenceValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICounter>('Counter', CounterSchema);
