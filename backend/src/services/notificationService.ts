import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  NotificationDocument,
  NotificationStatus,
  NotificationPriority,
  NOTIFICATION_STATUSES,
  NOTIFICATION_PRIORITIES,
  CreateNotificationDTO,
  NotificationFilterQuery
} from '../types/notification';
import { AuditLogService } from './auditLogService';
import { getTodayUtcDateString } from '../utils/dateUtils';

const isValidDateFormat = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

export class NotificationService {
  /**
   * Create a new notification (Admin only).
   * Validates branchId and recipientUserId within the authenticated tenant.
   * Emits NOTIFICATION_CREATED audit log attributed to the validated branch.
   */
  static async createNotification(
    tenantId: ObjectId,
    actorUserId: ObjectId,
    data: CreateNotificationDTO
  ): Promise<NotificationDocument> {
    const db = dbConnection.getDb();

    // 1. Validate branchId exists and belongs to the authenticated tenant
    if (!data.branchId || !ObjectId.isValid(data.branchId)) {
      throw new AppError('Valid branchId format is required.', 400);
    }
    const branchObjectId = new ObjectId(data.branchId);
    const branch = await db.collection('branches').findOne({
      _id: branchObjectId,
      organizationId: tenantId
    });
    if (!branch) {
      throw new AppError('Referenced branch not found in your organization.', 404);
    }

    // 2. Validate recipientUserId exists and belongs to the authenticated tenant Users
    if (!data.recipientUserId || !ObjectId.isValid(data.recipientUserId)) {
      throw new AppError('Valid recipientUserId format is required.', 400);
    }
    const recipientObjectId = new ObjectId(data.recipientUserId);
    const recipientUser = await db.collection('Users').findOne({
      _id: recipientObjectId,
      organizationId: tenantId
    });
    if (!recipientUser) {
      throw new AppError('Referenced recipient user not found in your organization.', 404);
    }

    // 3. Validate string fields
    if (!data.type || typeof data.type !== 'string' || !data.type.trim()) {
      throw new AppError('type is required.', 400);
    }
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new AppError('title is required.', 400);
    }
    if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
      throw new AppError('message is required.', 400);
    }

    // 4. Validate priority enum
    const priority: NotificationPriority = data.priority || 'medium';
    if (!NOTIFICATION_PRIORITIES.includes(priority)) {
      throw new AppError(
        `Invalid priority. Allowed values: ${NOTIFICATION_PRIORITIES.join(', ')}`,
        400
      );
    }

    // 5. Validate status enum
    const status: NotificationStatus = data.status || 'unread';
    if (!NOTIFICATION_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid status. Allowed values: ${NOTIFICATION_STATUSES.join(', ')}`,
        400
      );
    }

    // 6. Validate createdAt (YYYY-MM-DD)
    const createdAt = data.createdAt || getTodayUtcDateString();
    if (!isValidDateFormat(createdAt)) {
      throw new AppError('createdAt must be in YYYY-MM-DD format.', 400);
    }

    const newDoc: Omit<NotificationDocument, '_id'> = {
      organizationId: tenantId,
      branchId: branchObjectId,
      recipientUserId: recipientObjectId,
      type: data.type.trim(),
      title: data.title.trim(),
      message: data.message.trim(),
      priority,
      status,
      createdAt
    };

    const insertResult = await db.collection<NotificationDocument>('notifications').insertOne(newDoc as NotificationDocument);
    const createdNotification: NotificationDocument = {
      ...newDoc,
      _id: insertResult.insertedId
    };

    // 7. Emit audit log attributed to the validated branchId
    await AuditLogService.logAction({
      tenantId,
      branchId: branchObjectId,
      userId: actorUserId,
      action: 'NOTIFICATION_CREATED',
      entityType: 'notification',
      entityId: createdNotification._id,
      description: `Notification '${createdNotification.title}' created for recipient user (ID: ${recipientObjectId.toHexString()}).`
    });

    return createdNotification;
  }

  /**
   * List notifications with tenant isolation, role-based scoping, and database-level pagination.
   * Admins can view all notifications across the tenant or filter by branch/recipient.
   * Members are strictly forced to their own recipientUserId.
   */
  static async listNotifications(
    tenantId: ObjectId,
    user: { userId: string; role: string },
    filters: NotificationFilterQuery
  ): Promise<{
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: NotificationDocument[];
  }> {
    const db = dbConnection.getDb();
    const query: any = (user.role === 'admin' || !tenantId) ? {} : { organizationId: tenantId };

    // Role-based recipient scoping
    if (user.role === 'member') {
      query.recipientUserId = new ObjectId(user.userId);
    } else if (filters.recipientUserId) {
      if (!ObjectId.isValid(filters.recipientUserId)) {
        throw new AppError('Invalid recipientUserId query parameter format.', 400);
      }
      query.recipientUserId = new ObjectId(filters.recipientUserId);
    }

    // Filter by branchId
    if (filters.branchId) {
      if (!ObjectId.isValid(filters.branchId)) {
        throw new AppError('Invalid branchId query parameter format.', 400);
      }
      query.branchId = new ObjectId(filters.branchId);
    }

    // Filter by type
    if (filters.type && typeof filters.type === 'string' && filters.type.trim()) {
      query.type = filters.type.trim();
    }

    // Filter by priority
    if (filters.priority) {
      if (!NOTIFICATION_PRIORITIES.includes(filters.priority as NotificationPriority)) {
        throw new AppError(
          `Invalid priority filter. Allowed values: ${NOTIFICATION_PRIORITIES.join(', ')}`,
          400
        );
      }
      query.priority = filters.priority;
    }

    // Filter by status
    if (filters.status) {
      if (!NOTIFICATION_STATUSES.includes(filters.status as NotificationStatus)) {
        throw new AppError(
          `Invalid status filter. Allowed values: ${NOTIFICATION_STATUSES.join(', ')}`,
          400
        );
      }
      query.status = filters.status;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await db.collection('notifications').countDocuments(query);
    const data = await db
      .collection<NotificationDocument>('notifications')
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      count: data.length,
      total,
      page,
      limit,
      totalPages,
      data
    };
  }

  /**
   * Get notification by ID with tenant isolation and member ownership check.
   */
  static async getNotificationById(
    tenantId: ObjectId,
    user: { userId: string; role: string },
    notificationId: ObjectId
  ): Promise<NotificationDocument> {
    const db = dbConnection.getDb();
    const query: any = {
      _id: notificationId,
      organizationId: tenantId
    };

    if (user.role === 'member') {
      query.recipientUserId = new ObjectId(user.userId);
    }

    const notification = await db.collection<NotificationDocument>('notifications').findOne(query);

    if (!notification) {
      throw new AppError('Notification not found in your organization.', 404);
    }

    return notification;
  }

  /**
   * Atomically update notification status (read / unread).
   * Validates authorization prior to returning idempotent result.
   * Keeps tenant and recipient criteria inside the database query.
   * Emits NOTIFICATION_STATUS_UPDATED audit log using the notification's existing branchId.
   */
  static async updateNotificationStatus(
    tenantId: ObjectId,
    user: { userId: string; role: string },
    notificationId: ObjectId,
    newStatus: NotificationStatus
  ): Promise<NotificationDocument> {
    const db = dbConnection.getDb();

    // 1. Validate status enum
    if (!NOTIFICATION_STATUSES.includes(newStatus)) {
      throw new AppError(
        `Invalid notification status. Allowed values: ${NOTIFICATION_STATUSES.join(', ')}`,
        400
      );
    }

    // 2. Build tenant and role authorization filter
    const authFilter: any = {
      _id: notificationId,
      organizationId: tenantId
    };

    if (user.role === 'member') {
      authFilter.recipientUserId = new ObjectId(user.userId);
    }

    // 3. Verify existence and authorization before inspecting idempotency
    const existing = await db.collection<NotificationDocument>('notifications').findOne(authFilter);
    if (!existing) {
      throw new AppError('Notification not found in your organization.', 404);
    }

    // 4. Idempotent check: if status is already set, return unchanged document without redundant write/audit
    if (existing.status === newStatus) {
      return existing;
    }

    // 5. Atomic database update with tenant and recipient criteria
    await db.collection('notifications').updateOne(
      { ...authFilter, status: existing.status },
      { $set: { status: newStatus } }
    );

    const updated = await db.collection<NotificationDocument>('notifications').findOne(authFilter);
    if (!updated) {
      throw new AppError('Notification not found after update.', 404);
    }

    // 6. Emit audit log using the notification's existing branchId
    await AuditLogService.logAction({
      tenantId,
      branchId: existing.branchId,
      userId: new ObjectId(user.userId),
      action: 'NOTIFICATION_STATUS_UPDATED',
      entityType: 'notification',
      entityId: updated._id,
      description: `Notification (ID: ${notificationId.toHexString()}) status changed from '${existing.status}' to '${newStatus}'.`
    });

    return updated;
  }

  static async deleteNotification(
    tenantId: ObjectId | undefined,
    notificationId: ObjectId
  ): Promise<boolean> {
    const db = dbConnection.getDb();
    const query: any = { _id: notificationId };
    if (tenantId) {
      query.organizationId = tenantId;
    }
    const result = await db.collection('notifications').deleteOne(query);
    if (result.deletedCount === 0) {
      throw new AppError('Notification not found or already deleted.', 404);
    }
    return true;
  }
}
