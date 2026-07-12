import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  module: string;
  action: string;
  entityId?: string;
  entityName?: string;
  beforeValue?: any;
  afterValue?: any;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audited User reference is required'],
    },
    module: {
      type: String,
      required: [true, 'Audited module domain is required'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Audited action verb is required'],
      trim: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    entityName: {
      type: String,
      trim: true,
    },
    beforeValue: {
      type: Schema.Types.Mixed,
    },
    afterValue: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for performance on query filters
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
