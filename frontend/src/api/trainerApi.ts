import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  TrainerDocument,
  CreateTrainerDTO,
  UpdateTrainerDTO,
  TrainerFilterParams,
  TrainerAvailabilityDocument,
} from '../types/trainer.types';

export const trainerApi = {
  /**
   * List all trainers in the tenant with optional filters.
   */
  listTrainers: async (
    filters?: TrainerFilterParams
  ): Promise<TrainerDocument[]> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.branchId) params.branchId = filters.branchId;
    if (filters?.status) params.status = filters.status;
    if (filters?.specialization) params.specialization = filters.specialization;

    const response = await apiClient<TrainerDocument[]>('/trainers', {
      method: 'GET',
      params,
    });

    if (!Array.isArray(response.data)) {
      throw new ApiError('Malformed response: Expected trainer array.', 500);
    }

    return response.data;
  },

  /**
   * Get single trainer by ID.
   */
  getTrainerById: async (trainerId: string): Promise<TrainerDocument> => {
    const response = await apiClient<{ trainer: TrainerDocument } | TrainerDocument>(
      `/trainers/${trainerId}`,
      {
        method: 'GET',
      }
    );

    const record =
      (response.data as any)?.trainer || (response.data as TrainerDocument);

    if (!record || !record._id) {
      throw new ApiError('Trainer record was not returned by the server.', 500);
    }

    return record;
  },

  /**
   * Create a new trainer profile.
   */
  createTrainer: async (dto: CreateTrainerDTO): Promise<TrainerDocument> => {
    const response = await apiClient<TrainerDocument>('/trainers', {
      method: 'POST',
      body: JSON.stringify(dto),
    });

    if (!response.data) {
      throw new ApiError('Failed to create trainer profile.', 500);
    }

    return response.data;
  },

  /**
   * Update an existing trainer profile.
   */
  updateTrainer: async (
    trainerId: string,
    dto: UpdateTrainerDTO
  ): Promise<TrainerDocument> => {
    const response = await apiClient<TrainerDocument>(`/trainers/${trainerId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });

    if (!response.data) {
      throw new ApiError('Failed to update trainer profile.', 500);
    }

    return response.data;
  },

  /**
   * List read-only weekly availability slots for a trainer.
   */
  listAvailability: async (
    trainerId: string
  ): Promise<TrainerAvailabilityDocument[]> => {
    const response = await apiClient<TrainerAvailabilityDocument[]>(
      `/trainers/${trainerId}/availability`,
      {
        method: 'GET',
      }
    );

    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Permanently delete a trainer from the database.
   */
  deleteTrainer: async (trainerId: string): Promise<boolean> => {
    await apiClient(`/trainers/${trainerId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
