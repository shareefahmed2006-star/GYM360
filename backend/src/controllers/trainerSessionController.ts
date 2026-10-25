import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { TrainerService } from '../services/trainerService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export class TrainerSessionController {
  static async bookSession(
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

      const session = await TrainerService.bookSession(
        req.tenantId,
        callerRole,
        callerMemberId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Training session booked successfully',
        data: session
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSessionStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const sessionId = getParamId(req.params.sessionId, 'sessionId');
      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();
      const newStatus = req.body.status;

      const session = await TrainerService.updateSessionStatus(
        req.tenantId,
        callerRole,
        callerMemberId,
        sessionId,
        newStatus
      );

      res.status(200).json({
        success: true,
        message: `Session status updated to ${newStatus}`,
        data: session
      });
    } catch (err) {
      next(err);
    }
  }

  static async listSessions(
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

      const sessions = await TrainerService.listSessions(
        req.tenantId,
        callerRole,
        callerMemberId,
        req.query
      );

      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSessionById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const sessionId = getParamId(req.params.sessionId, 'sessionId');
      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();

      const session = await TrainerService.getSessionById(
        req.tenantId,
        callerRole,
        callerMemberId,
        sessionId
      );

      res.status(200).json({
        success: true,
        data: session
      });
    } catch (err) {
      next(err);
    }
  }
}
