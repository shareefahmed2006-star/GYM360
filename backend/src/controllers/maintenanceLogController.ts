import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { MaintenanceLogService } from '../services/maintenanceLogService';
import { AppError } from '../middleware/errorHandler';

const getParamMaintenanceLogId = (raw: string | string[] | undefined): ObjectId => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError('Invalid maintenance log identifier format. Expected 24-character hex ObjectId.', 400);
  }
  return new ObjectId(idStr);
};

export class MaintenanceLogController {
  static async createMaintenanceLog(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const userId = new ObjectId(req.user.userId);
      const log = await MaintenanceLogService.createMaintenanceLog(req.tenantId, userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Maintenance log created successfully',
        data: log
      });
    } catch (err) {
      next(err);
    }
  }

  static async listMaintenanceLogs(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const result = await MaintenanceLogService.listMaintenanceLogs(
        req.user?.role === 'admin' ? undefined : req.tenantId,
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

  static async getMaintenanceLogById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const logId = getParamMaintenanceLogId(req.params.maintenanceLogId);
      const log = await MaintenanceLogService.getMaintenanceLogById(req.tenantId, logId);

      res.status(200).json({
        success: true,
        data: log
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMaintenanceLog(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const logId = getParamMaintenanceLogId(req.params.maintenanceLogId);
      const userId = new ObjectId(req.user.userId);
      const updated = await MaintenanceLogService.updateMaintenanceLog(req.tenantId, userId, logId, req.body);

      res.status(200).json({
        success: true,
        message: 'Maintenance log details updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMaintenanceLogStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const logId = getParamMaintenanceLogId(req.params.maintenanceLogId);
      const userId = new ObjectId(req.user.userId);
      const { status } = req.body;

      if (!status || typeof status !== 'string') {
        throw new AppError('Status field is required.', 400);
      }

      const updated = await MaintenanceLogService.updateMaintenanceLogStatus(req.tenantId, userId, logId, status as any);

      res.status(200).json({
        success: true,
        message: 'Maintenance log status updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteMaintenanceLog(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const logId = getParamMaintenanceLogId(req.params.maintenanceLogId);
      const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
      await MaintenanceLogService.deleteMaintenanceLog(tenant, logId);
      res.status(200).json({
        success: true,
        message: 'Maintenance log deleted successfully from database',
      });
    } catch (err) {
      next(err);
    }
  }
}
