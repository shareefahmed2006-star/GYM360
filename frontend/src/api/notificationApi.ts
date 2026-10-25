import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  NotificationDocument,
  CreateNotificationDTO,
  UpdateNotificationStatusDTO,
  NotificationFilterParams,
  NotificationListResponse,
} from '../types/notification.types';

export const notificationApi = {
  /**
   * List notifications with optional server-side filters and pagination.
   */
  listNotifications: async (
    filters?: NotificationFilterParams
  ): Promise<NotificationListResponse> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.branchId && filters.branchId !== 'all') params.branchId = filters.branchId;
    if (filters?.recipientUserId && filters.recipientUserId !== 'all') params.recipientUserId = filters.recipientUserId;
    if (filters?.type && filters.type !== 'all') params.type = filters.type;
    if (filters?.priority && filters.priority !== 'all') params.priority = filters.priority;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const response = await apiClient<NotificationDocument[]>('/notifications', {
      method: 'GET',
      params,
    });

    if (!Array.isArray(response.data)) {
      throw new ApiError('Malformed response: Expected notifications array.', 500);
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
   * Get single notification by ID.
   */
  getNotificationById: async (notificationId: string): Promise<NotificationDocument> => {
    const response = await apiClient<NotificationDocument>(`/notifications/${notificationId}`, {
      method: 'GET',
    });

    if (!response.data || !response.data._id) {
      throw new ApiError('Notification record was not returned by the server.', 500);
    }

    return response.data;
  },

  /**
   * Create and dispatch a new in-app notification record for a single recipient.
   */
  createNotification: async (
    dto: CreateNotificationDTO
  ): Promise<NotificationDocument> => {
    const response = await apiClient<NotificationDocument>('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        branchId: dto.branchId,
        recipientUserId: dto.recipientUserId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        priority: dto.priority || 'medium',
        status: dto.status || 'unread',
        createdAt: dto.createdAt,
      }),
    });

    if (!response.data) {
      throw new ApiError('Failed to create in-app notification record.', 500);
    }

    return response.data;
  },

  /**
   * Update read/unread status of notification via dedicated PATCH endpoint.
   */
  updateNotificationStatus: async (
    notificationId: string,
    dto: UpdateNotificationStatusDTO
  ): Promise<NotificationDocument> => {
    const response = await apiClient<NotificationDocument>(
      `/notifications/${notificationId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: dto.status }),
      }
    );

    if (!response.data) {
      throw new ApiError('Failed to update notification status.', 500);
    }

    return response.data;
  },

  /**
   * Permanently delete a notification from the database.
   */
  deleteNotification: async (notificationId: string): Promise<boolean> => {
    await apiClient(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
