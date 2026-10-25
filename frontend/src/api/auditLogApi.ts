import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  AuditLogDocument,
  AuditLogFilterParams,
  AuditLogListResponse,
} from '../types/auditLog.types';

export const auditLogApi = {
  /**
   * List security audit logs with optional server-side filters and pagination.
   */
  listAuditLogs: async (
    filters?: AuditLogFilterParams
  ): Promise<AuditLogListResponse> => {
    const params: Record<string, string | number | undefined> = {};

    if (filters?.branchId && filters.branchId !== 'all') {
      params.branchId = filters.branchId;
    }
    if (filters?.entityType && filters.entityType !== 'all') {
      params.entityType = filters.entityType.trim();
    }
    if (filters?.action && filters.action !== 'all') {
      params.action = filters.action.trim();
    }
    if (filters?.entityId && filters.entityId.trim()) {
      params.entityId = filters.entityId.trim();
    }
    if (filters?.userId && filters.userId.trim()) {
      params.userId = filters.userId.trim();
    }
    if (filters?.date && filters.date.trim()) {
      params.date = filters.date.trim();
    }
    if (filters?.page) {
      params.page = filters.page;
    }
    if (filters?.limit) {
      params.limit = filters.limit;
    }

    const response = await apiClient<AuditLogDocument[]>('/audit-logs', {
      method: 'GET',
      params,
    });

    if (!Array.isArray(response.data)) {
      throw new ApiError('Malformed response: Expected audit logs array.', 500);
    }

    return {
      data: response.data,
      count: response.count ?? response.data.length,
      total: response.total ?? response.data.length,
      page: response.page ?? (filters?.page || 1),
      limit: response.limit ?? (filters?.limit || 50),
      totalPages: response.totalPages ?? 1,
    };
  },
};
