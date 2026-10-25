import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { WorkoutPlanService } from '../services/workoutPlanService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export class WorkoutPlanController {
  static async createPlan(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const plan = await WorkoutPlanService.createPlan(
        req.tenantId,
        req.user.role,
        req.user.userId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Workout plan created successfully',
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }

  static async updatePlan(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const planId = getParamId(req.params.planId, 'planId');

      const plan = await WorkoutPlanService.updatePlan(
        req.tenantId,
        req.user.role,
        planId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Workout plan updated successfully',
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }

  static async listPlans(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const plans = await WorkoutPlanService.listPlans(
        (req.user.role === 'admin' ? undefined : req.tenantId) as any,
        req.user.role,
        req.query
      );

      res.status(200).json({
        success: true,
        count: plans.length,
        data: plans
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPlanById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const planId = getParamId(req.params.planId, 'planId');
      const plan = await WorkoutPlanService.getPlanById(
        req.tenantId,
        req.user.role,
        planId
      );

      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }
}
