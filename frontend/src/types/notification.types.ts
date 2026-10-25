export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationStatus = 'unread' | 'read';

export const NOTIFICATION_PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high'];
export const NOTIFICATION_STATUSES: NotificationStatus[] = ['unread', 'read'];

export interface NotificationDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string; // YYYY-MM-DD
}

export interface CreateNotificationDTO {
  branchId: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  createdAt?: string;
}

export interface UpdateNotificationStatusDTO {
  status: NotificationStatus;
}

export interface NotificationFilterParams {
  branchId?: string;
  recipientUserId?: string;
  type?: string;
  priority?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: NotificationDocument[];
}
