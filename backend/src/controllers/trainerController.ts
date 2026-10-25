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

export class TrainerController {
  static async createTrainer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const trainer = await TrainerService.createTrainer(
        req.tenantId,
        req.user.role,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Trainer profile created successfully',
        data: trainer
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTrainer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const trainerId = getParamId(req.params.trainerId, 'trainerId');

      const updated = await TrainerService.updateTrainer(
        req.tenantId,
        req.user.role,
        trainerId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Trainer profile updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async listTrainers(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId) {
        throw new AppError('Unauthorized: Missing tenant context', 401);
      }

      const trainers = await TrainerService.listTrainers(
        req.user?.role === 'admin' ? undefined : req.tenantId,
        req.query
      );

      res.status(200).json({
        success: true,
        count: trainers.length,
        data: trainers
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrainerById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId) {
        throw new AppError('Unauthorized: Missing tenant context', 401);
      }

      const trainerId = getParamId(req.params.trainerId, 'trainerId');
      const trainer = await TrainerService.getTrainerById(
        req.tenantId,
        trainerId
      );

      res.status(200).json({
        success: true,
        data: trainer
      });
    } catch (err) {
      next(err);
    }
  }

  static async createAvailability(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const trainerId = getParamId(req.params.trainerId, 'trainerId');
      const slot = await TrainerService.createAvailability(
        req.tenantId,
        req.user.role,
        trainerId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Availability slot added successfully',
        data: slot
      });
    } catch (err) {
      next(err);
    }
  }

  static async listAvailability(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId) {
        throw new AppError('Unauthorized: Missing tenant context', 401);
      }

      const trainerId = getParamId(req.params.trainerId, 'trainerId');
      const slots = await TrainerService.listAvailability(
        req.tenantId,
        trainerId
      );

      res.status(200).json({
        success: true,
        count: slots.length,
        data: slots
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAvailabilityStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context', 401);
      }

      const trainerId = getParamId(req.params.trainerId, 'trainerId');
      const slotId = getParamId(req.params.slotId, 'slotId');
      const newStatus = req.body.status;

      const slot = await TrainerService.updateAvailabilityStatus(
        req.tenantId,
        req.user.role,
        trainerId,
        slotId,
        newStatus
      );

      res.status(200).json({
        success: true,
        message: `Availability slot status updated to ${newStatus}`,
        data: slot
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTrainer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const trainerId = getParamId(req.params.trainerId, 'trainerId');
      const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
      await TrainerService.deleteTrainer(tenant, trainerId);
      res.status(200).json({
        success: true,
        message: 'Trainer deleted successfully from database',
      });
    } catch (err) {
      next(err);
    }
  }
}
