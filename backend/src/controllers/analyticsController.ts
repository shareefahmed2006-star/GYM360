import { Response, NextFunction } from 'express';
import { AuthorizedRequest } from '../types/authorization';
import { AnalyticsService } from '../services/analyticsService';
import { AppError } from '../middleware/errorHandler';
import {
  getTodayUtcDateString,
  isValidUtcDateString
} from '../utils/dateUtils';

export class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   */
  static async getDashboard(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const isGlobalAdmin = req.user?.isGlobal || req.user?.email === 'admin@gym360.com';
      const effectiveBranch = req.user?.branchId || (req.query.branchId as string | undefined);

      const branchObjectId = await AnalyticsService.validateTenantBranch(
        req.tenantId,
        effectiveBranch
      );

      const data = await AnalyticsService.getExecutiveDashboard(
        (isGlobalAdmin ? undefined : req.tenantId) as any,
        branchObjectId
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/revenue
   */
  static async getRevenue(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const { startDate, endDate, branchId } = req.query as {
        startDate?: string;
        endDate?: string;
        branchId?: string;
      };

      let resolvedStartDate: string;
      let resolvedEndDate: string;

      // Rule: Both omitted -> default to MTD interval
      if (!startDate && !endDate) {
        const todayUtc = getTodayUtcDateString();
        resolvedStartDate = `${todayUtc.slice(0, 7)}-01`;
        resolvedEndDate = todayUtc;
      }
      // Rule: Partial dates (only one supplied) -> return 400
      else if (!startDate || !endDate) {
        throw new AppError(
          'Both startDate and endDate must be provided together, or both omitted for month-to-date default.',
          400
        );
      }
      // Rule: Both supplied -> validate format and range
      else {
        if (!isValidUtcDateString(startDate)) {
          throw new AppError('Invalid startDate format. Expected YYYY-MM-DD.', 400);
        }
        if (!isValidUtcDateString(endDate)) {
          throw new AppError('Invalid endDate format. Expected YYYY-MM-DD.', 400);
        }
        if (startDate > endDate) {
          throw new AppError('startDate cannot be after endDate.', 400);
        }
        resolvedStartDate = startDate;
        resolvedEndDate = endDate;
      }

      const branchObjectId = await AnalyticsService.validateTenantBranch(req.tenantId, branchId);

      const data = await AnalyticsService.calculateRevenueMetrics(
        (req.user?.role === 'admin' ? undefined : req.tenantId) as any,
        branchObjectId,
        resolvedStartDate,
        resolvedEndDate
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/attendance
   */
  static async getAttendance(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const { date, branchId } = req.query as {
        date?: string;
        branchId?: string;
      };

      const resolvedDate = date || getTodayUtcDateString();
      if (!isValidUtcDateString(resolvedDate)) {
        throw new AppError('Invalid date format. Expected YYYY-MM-DD.', 400);
      }

      const branchObjectId = await AnalyticsService.validateTenantBranch(req.tenantId, branchId);

      const data = await AnalyticsService.calculateAttendanceMetrics(
        (req.user?.role === 'admin' ? undefined : req.tenantId) as any,
        branchObjectId,
        resolvedDate
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/membership-retention
   */
  static async getMembershipRetention(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const { daysAhead, branchId } = req.query as {
        daysAhead?: string;
        branchId?: string;
      };

      let resolvedDaysAhead = 30;
      if (daysAhead !== undefined) {
        const parsed = parseInt(daysAhead, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 365) {
          throw new AppError('daysAhead must be a positive integer between 1 and 365.', 400);
        }
        resolvedDaysAhead = parsed;
      }

      const branchObjectId = await AnalyticsService.validateTenantBranch(req.tenantId, branchId);

      const data = await AnalyticsService.calculateRetentionMetrics(
        (req.user?.role === 'admin' ? undefined : req.tenantId) as any,
        branchObjectId,
        resolvedDaysAhead
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}
