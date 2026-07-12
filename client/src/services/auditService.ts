import api from './api';

export interface AuditLogData {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  module: string;
  action: string;
  entityId?: string;
  entityName?: string;
  beforeValue?: any;
  afterValue?: any;
  timestamp: string;
}

export interface AuditLogResponse {
  success: boolean;
  message: string;
  data: {
    logs: AuditLogData[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  };
}

const auditService = {
  getAuditLogs: (params?: {
    user?: string;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return api.get<AuditLogResponse>('/audit', { params });
  },
};

export default auditService;
