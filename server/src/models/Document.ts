import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  type:
    | 'Registration Certificate'
    | 'Insurance'
    | 'Fitness Certificate'
    | 'Pollution Certificate'
    | 'Driver License';
  entityId: mongoose.Types.ObjectId;
  entityType: 'Vehicle' | 'Driver';
  expiryDate?: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    name: {
      type: String,
      required: [true, 'Document display name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Document category type is required'],
      enum: {
        values: [
          'Registration Certificate',
          'Insurance',
          'Fitness Certificate',
          'Pollution Certificate',
          'Driver License',
        ],
        message: '{VALUE} is not a valid document type',
      },
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target associated Entity ID is required'],
    },
    entityType: {
      type: String,
      required: [true, 'Target associated Entity Type is required'],
      enum: ['Vehicle', 'Driver'],
    },
    expiryDate: {
      type: Date,
    },
    fileUrl: {
      type: String,
      required: [true, 'File data URL or link path is required'],
    },
    fileName: {
      type: String,
      required: [true, 'Physical filename is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [0, 'File size cannot be negative'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader User reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for quick lookups on entity profile tabs and expiry schedules
DocumentSchema.index({ entityId: 1, entityType: 1 });
DocumentSchema.index({ type: 1 });
DocumentSchema.index({ expiryDate: 1 });

export default mongoose.model<IDocument>('Document', DocumentSchema);
