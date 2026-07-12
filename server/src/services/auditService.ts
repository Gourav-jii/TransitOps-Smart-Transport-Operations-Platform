import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

export interface AuditLogParams {
  user: mongoose.Types.ObjectId | string;
  module: string;
  action: string;
  entityId?: string;
  entityName?: string;
  beforeValue?: any;
  afterValue?: any;
}

class AuditService {
  /**
   * Log an audit event to the database
   */
  async log(params: AuditLogParams) {
    try {
      const logEntry = await AuditLog.create({
        user: typeof params.user === 'string' ? new mongoose.Types.ObjectId(params.user) : params.user,
        module: params.module,
        action: params.action,
        entityId: params.entityId,
        entityName: params.entityName,
        beforeValue: params.beforeValue,
        afterValue: params.afterValue,
        timestamp: new Date(),
      });
      return logEntry;
    } catch (error) {
      console.error('Audit Logging Failed:', (error as Error).message);
      return null;
    }
  }
}

export default new AuditService();
