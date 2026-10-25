import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { AttendanceService } from '../services/attendanceService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export class AttendanceController {
  static async checkIn(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();

      const record = await AttendanceService.checkIn(
        req.tenantId,
        callerRole,
        callerMemberId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Check-in recorded successfully',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkOut(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();

      const record = await AttendanceService.checkOut(
        req.tenantId,
        callerRole,
        callerMemberId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Check-out recorded successfully',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  static async createManual(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const callerRole = req.user.role;

      const record = await AttendanceService.createManual(
        req.tenantId,
        callerRole,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Manual attendance record created successfully',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAttendance(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();

      const result = await AttendanceService.getAttendance(
        callerRole === 'admin' ? undefined as any : req.tenantId,
        callerRole,
        callerMemberId,
        req.query
      );

      res.status(200).json({
        success: true,
        count: result.count,
        data: result.data
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAttendanceById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const attendanceIdStr = getParamId(req.params.attendanceId, 'attendanceId');
      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();

      const record = await AttendanceService.getAttendanceById(
        req.tenantId,
        callerRole,
        callerMemberId,
        attendanceIdStr
      );

      res.status(200).json({
        success: true,
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAttendance(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const attendanceIdStr = getParamId(req.params.attendanceId, 'attendanceId');
      const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
      await AttendanceService.deleteAttendance(tenant, attendanceIdStr);
      res.status(200).json({
        success: true,
        message: 'Attendance record deleted successfully from database',
      });
    } catch (err) {
      next(err);
    }
  }
}
