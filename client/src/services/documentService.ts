import api from './api';

export interface DocumentData {
  _id?: string;
  name: string;
  type:
    | 'Registration Certificate'
    | 'Insurance'
    | 'Fitness Certificate'
    | 'Pollution Certificate'
    | 'Driver License';
  entityId: string;
  entityType: 'Vehicle' | 'Driver';
  expiryDate?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
}

const documentService = {
  getDocuments: (params?: { entityId?: string; entityType?: string; type?: string }) => {
    return api.get<{ success: boolean; data: DocumentData[] }>('/documents', { params });
  },

  uploadDocument: (data: DocumentData) => {
    return api.post<{ success: boolean; data: DocumentData }>('/documents', data);
  },

  deleteDocument: (id: string) => {
    return api.delete<{ success: boolean; message: string }>(`/documents/${id}`);
  },
};

export default documentService;
