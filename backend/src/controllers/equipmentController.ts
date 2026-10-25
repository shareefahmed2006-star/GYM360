import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { EquipmentService } from '../services/equipmentService';
import { AppError } from '../middleware/errorHandler';

const getParamEquipmentId = (raw: string | string[] | undefined): ObjectId => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError('Invalid equipment identifier format. Expected 24-character hex ObjectId.', 400);
  }
  return new ObjectId(idStr);
};

export class EquipmentController {
  static async createEquipment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const userId = new ObjectId(req.user.userId);
      const equipment = await EquipmentService.createEquipment(req.tenantId, userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Equipment registered successfully',
        data: equipment
      });
    } catch (err) {
      next(err);
    }
  }

  static async listEquipment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const result = await EquipmentService.listEquipment(
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

  static async getEquipmentById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const equipmentId = getParamEquipmentId(req.params.equipmentId);
      const equipment = await EquipmentService.getEquipmentById(req.tenantId, equipmentId);

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEquipment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const equipmentId = getParamEquipmentId(req.params.equipmentId);
      const userId = new ObjectId(req.user.userId);
      const updated = await EquipmentService.updateEquipment(req.tenantId, userId, equipmentId, req.body);

      res.status(200).json({
        success: true,
        message: 'Equipment details updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEquipmentStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenantId || !req.user) {
        throw new AppError('Unauthorized: Missing tenant or user context.', 401);
      }

      const equipmentId = getParamEquipmentId(req.params.equipmentId);
      const userId = new ObjectId(req.user.userId);
      const { status } = req.body;

      if (!status || typeof status !== 'string') {
        throw new AppError('Status field is required.', 400);
      }

      const updated = await EquipmentService.updateEquipmentStatus(req.tenantId, userId, equipmentId, status as any);

      res.status(200).json({
        success: true,
        message: 'Equipment status updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteEquipment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const equipmentId = getParamEquipmentId(req.params.equipmentId);
      const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
      await EquipmentService.deleteEquipment(tenant, equipmentId);
      res.status(200).json({
        success: true,
        message: 'Equipment deleted successfully from database',
      });
    } catch (err) {
      next(err);
    }
  }
}
