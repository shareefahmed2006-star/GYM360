export interface AuditLogDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string; // YYYY-MM-DD
}

export interface AuditLogFilterParams {
  branchId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  date?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  data: AuditLogDocument[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
