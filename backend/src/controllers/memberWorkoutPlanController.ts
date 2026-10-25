import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { MemberWorkoutPlanService } from '../services/memberWorkoutPlanService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export class MemberWorkoutPlanController {
  static async assignPlan(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const assignment = await MemberWorkoutPlanService.assignPlan(
        req.tenantId,
        req.user.role,
        req.user.userId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Workout plan assigned to member successfully',
        data: assignment
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAssignmentStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const assignmentId = getParamId(req.params.assignmentId, 'assignmentId');
      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();
      const newStatus = req.body.status;

      const assignment = await MemberWorkoutPlanService.updateAssignmentStatus(
        req.tenantId,
        callerRole,
        callerMemberId,
        assignmentId,
        newStatus
      );

      res.status(200).json({
        success: true,
        message: `Workout plan assignment status updated to ${newStatus}`,
        data: assignment
      });
    } catch (err) {
      next(err);
    }
  }

  static async listAssignments(
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

      const result = await MemberWorkoutPlanService.listAssignments(
        req.tenantId,
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

  static async getAssignmentById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const assignmentId = getParamId(req.params.assignmentId, 'assignmentId');
      const callerRole = req.user.role;
      const callerMemberId = (req.user as any)?.memberId?.toString();

      const assignment = await MemberWorkoutPlanService.getAssignmentById(
        req.tenantId,
        callerRole,
        callerMemberId,
        assignmentId
      );

      res.status(200).json({
        success: true,
        data: assignment
      });
    } catch (err) {
      next(err);
    }
  }
}
