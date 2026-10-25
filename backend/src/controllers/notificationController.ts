import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { NotificationService } from '../services/notificationService';
import { AppError } from '../middleware/errorHandler';

const getParamNotificationId = (raw: string | string[] | undefined): ObjectId => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError('Invalid notification identifier format. Expected 24-character hex ObjectId.', 400);
  }
  return new ObjectId(idStr);
};

export class NotificationController {
  static async createNotification(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const actorUserId = new ObjectId(req.user.userId);
      const notification = await NotificationService.createNotification(
        req.tenantId,
        actorUserId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (err) {
      next(err);
    }
  }

  static async listNotifications(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const result = await NotificationService.listNotifications(
        (req.user.role === 'admin' ? undefined : req.tenantId) as any,
        req.user,
        req.query
      );

      res.status(200).json({
        success: true,
        count: result.count,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        data: result.data
      });
    } catch (err) {
      next(err);
    }
  }

  static async getNotificationById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const notificationId = getParamNotificationId(req.params.notificationId);
      const notification = await NotificationService.getNotificationById(
        req.tenantId,
        req.user,
        notificationId
      );

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateNotificationStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const notificationId = getParamNotificationId(req.params.notificationId);
      const { status } = req.body;

      if (!status) {
        throw new AppError('status is required in request body.', 400);
      }

      const updated = await NotificationService.updateNotificationStatus(
        req.tenantId,
        req.user,
        notificationId,
        status
      );

      res.status(200).json({
        success: true,
        message: 'Notification status updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteNotification(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const notificationId = getParamNotificationId(req.params.notificationId);
      const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
      await NotificationService.deleteNotification(tenant, notificationId);
      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully from database',
      });
    } catch (err) {
      next(err);
    }
  }
}
