import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  EquipmentDocument,
  CreateEquipmentDTO,
  UpdateEquipmentDTO,
  UpdateEquipmentStatusDTO,
  EquipmentFilterParams,
  EquipmentListResponse,
} from '../types/equipment.types';

export const equipmentApi = {
  /**
   * List equipment with optional server-side filters and pagination.
   */
  listEquipment: async (
    filters?: EquipmentFilterParams
  ): Promise<EquipmentListResponse> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.branchId && filters.branchId !== 'all') params.branchId = filters.branchId;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.category && filters.category !== 'all') params.category = filters.category;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const response = await apiClient<EquipmentDocument[]>('/equipment', {
      method: 'GET',
      params,
    });

    if (!Array.isArray(response.data)) {
      throw new ApiError('Malformed response: Expected equipment array.', 500);
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
   * Get single equipment record by ID.
   */
  getEquipmentById: async (equipmentId: string): Promise<EquipmentDocument> => {
    const response = await apiClient<EquipmentDocument>(`/equipment/${equipmentId}`, {
      method: 'GET',
    });

    if (!response.data || !response.data._id) {
      throw new ApiError('Equipment record was not returned by the server.', 500);
    }

    return response.data;
  },

  /**
   * Register a new equipment asset.
   */
  createEquipment: async (dto: CreateEquipmentDTO): Promise<EquipmentDocument> => {
    const response = await apiClient<EquipmentDocument>('/equipment', {
      method: 'POST',
      body: JSON.stringify(dto),
    });

    if (!response.data) {
      throw new ApiError('Failed to create equipment record.', 500);
    }

    return response.data;
  },

  /**
   * Update mutable equipment details.
   * Note: The backend strictly rejects _id, organizationId, and branchId.
   */
  updateEquipment: async (
    equipmentId: string,
    dto: UpdateEquipmentDTO
  ): Promise<EquipmentDocument> => {
    // Explicitly construct payload to guarantee no forbidden immutable fields
    const sanitizedPayload: UpdateEquipmentDTO = {
      name: dto.name,
      category: dto.category,
      brand: dto.brand,
      model: dto.model,
      serialNumber: dto.serialNumber,
      purchaseDate: dto.purchaseDate,
      lastMaintenanceDate: dto.lastMaintenanceDate,
      nextMaintenanceDate: dto.nextMaintenanceDate,
    };

    const response = await apiClient<EquipmentDocument>(`/equipment/${equipmentId}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedPayload),
    });

    if (!response.data) {
      throw new ApiError('Failed to update equipment details.', 500);
    }

    return response.data;
  },

  /**
   * Update operational status via dedicated endpoint.
   */
  updateEquipmentStatus: async (
    equipmentId: string,
    dto: UpdateEquipmentStatusDTO
  ): Promise<EquipmentDocument> => {
    const response = await apiClient<EquipmentDocument>(`/equipment/${equipmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: dto.status }),
    });

    if (!response.data) {
      throw new ApiError('Failed to update equipment status.', 500);
    }

    return response.data;
  },

  /**
   * Permanently delete equipment from the database.
   */
  deleteEquipment: async (equipmentId: string): Promise<boolean> => {
    await apiClient(`/equipment/${equipmentId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
