import { ObjectId } from 'mongodb';

export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationStatus = 'unread' | 'read';

export const NOTIFICATION_PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high'];
export const NOTIFICATION_STATUSES: NotificationStatus[] = ['unread', 'read'];

export interface NotificationDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  recipientUserId: ObjectId;
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

export interface NotificationFilterQuery {
  branchId?: string;
  recipientUserId?: string;
  type?: string;
  priority?: string;
  status?: string;
  page?: string | number;
  limit?: string | number;
}
