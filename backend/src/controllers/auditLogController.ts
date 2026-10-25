import { Response, NextFunction } from 'express';
import { AuthorizedRequest } from '../types/authorization';
import { AuditLogService } from '../services/auditLogService';
import { AppError } from '../middleware/errorHandler';

export class AuditLogController {
  static async listAuditLogs(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const result = await AuditLogService.listAuditLogs(
        (req.user?.role === 'admin' ? undefined : req.tenantId) as any,
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
}
