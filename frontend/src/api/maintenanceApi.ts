import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  MaintenanceLogDocument,
  CreateMaintenanceLogDTO,
  UpdateMaintenanceLogDTO,
  UpdateMaintenanceLogStatusDTO,
  MaintenanceLogFilterParams,
  MaintenanceLogListResponse,
} from '../types/maintenance.types';

export const maintenanceApi = {
  /**
   * List maintenance logs with optional server-side filters and pagination.
   */
  listMaintenanceLogs: async (
    filters?: MaintenanceLogFilterParams
  ): Promise<MaintenanceLogListResponse> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.branchId && filters.branchId !== 'all') params.branchId = filters.branchId;
    if (filters?.equipmentId && filters.equipmentId !== 'all') params.equipmentId = filters.equipmentId;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const response = await apiClient<MaintenanceLogDocument[]>('/maintenance-logs', {
      method: 'GET',
      params,
    });

    if (!Array.isArray(response.data)) {
      throw new ApiError('Malformed response: Expected maintenance logs array.', 500);
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

  /**
   * Get single maintenance log by ID.
   */
  getMaintenanceLogById: async (logId: string): Promise<MaintenanceLogDocument> => {
    const response = await apiClient<MaintenanceLogDocument>(`/maintenance-logs/${logId}`, {
      method: 'GET',
    });

    if (!response.data || !response.data._id) {
      throw new ApiError('Maintenance log record was not returned by the server.', 500);
    }

    return response.data;
  },

  /**
   * Create a new maintenance work order.
   * Note: branchId is derived automatically on the backend from the referenced equipment.
   */
  createMaintenanceLog: async (
    dto: CreateMaintenanceLogDTO
  ): Promise<MaintenanceLogDocument> => {
    const response = await apiClient<MaintenanceLogDocument>('/maintenance-logs', {
      method: 'POST',
      body: JSON.stringify({
        equipmentId: dto.equipmentId,
        maintenanceDate: dto.maintenanceDate,
        maintenanceType: dto.maintenanceType,
        description: dto.description,
        performedBy: dto.performedBy,
        cost: Number(dto.cost),
        status: dto.status || 'scheduled',
        nextMaintenanceDate: dto.nextMaintenanceDate,
      }),
    });

    if (!response.data) {
      throw new ApiError('Failed to create maintenance log.', 500);
    }

    return response.data;
  },

  /**
   * Update mutable maintenance log details.
   * Note: The backend strictly rejects _id, organizationId, branchId, and equipmentId.
   */
  updateMaintenanceLog: async (
    logId: string,
    dto: UpdateMaintenanceLogDTO
  ): Promise<MaintenanceLogDocument> => {
    // Explicitly construct sanitized payload with mutable fields only
    const sanitizedPayload: UpdateMaintenanceLogDTO = {};
    if (dto.maintenanceType !== undefined) sanitizedPayload.maintenanceType = dto.maintenanceType;
    if (dto.description !== undefined) sanitizedPayload.description = dto.description;
    if (dto.performedBy !== undefined) sanitizedPayload.performedBy = dto.performedBy;
    if (dto.maintenanceDate !== undefined) sanitizedPayload.maintenanceDate = dto.maintenanceDate;
    if (dto.nextMaintenanceDate !== undefined) sanitizedPayload.nextMaintenanceDate = dto.nextMaintenanceDate;
    if (dto.cost !== undefined) sanitizedPayload.cost = Number(dto.cost);

    const response = await apiClient<MaintenanceLogDocument>(`/maintenance-logs/${logId}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedPayload),
    });

    if (!response.data) {
      throw new ApiError('Failed to update maintenance log details.', 500);
    }

    return response.data;
  },

  /**
   * Update operational status of maintenance log via dedicated PATCH endpoint.
   */
  updateMaintenanceLogStatus: async (
    logId: string,
    dto: UpdateMaintenanceLogStatusDTO
  ): Promise<MaintenanceLogDocument> => {
    const response = await apiClient<MaintenanceLogDocument>(`/maintenance-logs/${logId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: dto.status }),
    });

    if (!response.data) {
      throw new ApiError('Failed to update maintenance log status.', 500);
    }

    return response.data;
  },

  /**
   * Permanently delete a maintenance log from the database.
   */
  deleteMaintenanceLog: async (logId: string): Promise<boolean> => {
    await apiClient(`/maintenance-logs/${logId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
