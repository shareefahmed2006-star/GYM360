import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  MaintenanceLogDocument,
  MaintenanceLogStatus,
  MAINTENANCE_LOG_STATUSES,
  CreateMaintenanceLogDTO,
  UpdateMaintenanceLogDTO,
  MaintenanceLogFilterQuery
} from '../types/maintenanceLog';
import { EquipmentDocument } from '../types/equipment';
import { AuditLogService } from './auditLogService';

const isValidDateFormat = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

export class MaintenanceLogService {
  static async createMaintenanceLog(
    tenantId: ObjectId,
    userId: ObjectId,
    data: CreateMaintenanceLogDTO
  ): Promise<MaintenanceLogDocument> {
    const db = dbConnection.getDb();

    // 1. Validate equipmentId and verify tenant ownership
    if (!data.equipmentId || !ObjectId.isValid(data.equipmentId)) {
      throw new AppError('Valid equipmentId format is required.', 400);
    }
    const equipmentObjectId = new ObjectId(data.equipmentId);
    const equipment = await db.collection<EquipmentDocument>('equipment').findOne({
      _id: equipmentObjectId,
      organizationId: tenantId
    });

    if (!equipment) {
      throw new AppError('Referenced equipment not found in your organization.', 404);
    }

    // 2. Strict branch derivation: branchId is always derived directly from referenced equipment
    const branchObjectId = equipment.branchId;

    // 3. Validate strings
    if (!data.maintenanceType || typeof data.maintenanceType !== 'string' || !data.maintenanceType.trim()) {
      throw new AppError('maintenanceType is required.', 400);
    }
    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
      throw new AppError('description is required.', 400);
    }
    if (!data.performedBy || typeof data.performedBy !== 'string' || !data.performedBy.trim()) {
      throw new AppError('performedBy is required.', 400);
    }

    // 4. Validate dates
    if (!data.maintenanceDate || !isValidDateFormat(data.maintenanceDate)) {
      throw new AppError('maintenanceDate is required and must be in YYYY-MM-DD format.', 400);
    }
    if (!data.nextMaintenanceDate || !isValidDateFormat(data.nextMaintenanceDate)) {
      throw new AppError('nextMaintenanceDate is required and must be in YYYY-MM-DD format.', 400);
    }

    // 5. Validate cost (number >= 0)
    if (typeof data.cost !== 'number' || !Number.isFinite(data.cost) || data.cost < 0) {
      throw new AppError('cost must be a valid finite number greater than or equal to 0.', 400);
    }

    // 6. Validate status
    const status: MaintenanceLogStatus = data.status || 'scheduled';
    if (!MAINTENANCE_LOG_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid maintenance status. Allowed values: ${MAINTENANCE_LOG_STATUSES.join(', ')}`,
        400
      );
    }

    const newDoc: Omit<MaintenanceLogDocument, '_id'> = {
      organizationId: tenantId,
      branchId: branchObjectId,
      equipmentId: equipmentObjectId,
      maintenanceDate: data.maintenanceDate,
      maintenanceType: data.maintenanceType.trim(),
      description: data.description.trim(),
      performedBy: data.performedBy.trim(),
      cost: data.cost,
      status,
      nextMaintenanceDate: data.nextMaintenanceDate
    };

    const insertResult = await db.collection<MaintenanceLogDocument>('maintenanceLogs').insertOne(newDoc as MaintenanceLogDocument);
    const createdLog: MaintenanceLogDocument = {
      ...newDoc,
      _id: insertResult.insertedId
    };

    // 7. Emit audit log
    await AuditLogService.logAction({
      tenantId,
      branchId: branchObjectId,
      userId,
      action: 'MAINTENANCE_CREATED',
      entityType: 'maintenance',
      entityId: createdLog._id,
      description: `Maintenance '${createdLog.maintenanceType}' logged for equipment '${equipment.name}' (ID: ${equipmentObjectId.toHexString()}).`
    });

    return createdLog;
  }

  static async listMaintenanceLogs(
    tenantId: ObjectId | undefined,
    filters: MaintenanceLogFilterQuery
  ): Promise<{
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: MaintenanceLogDocument[];
  }> {
    const db = dbConnection.getDb();
    const query: any = tenantId ? { organizationId: tenantId } : {};

    if (filters.equipmentId) {
      if (!ObjectId.isValid(filters.equipmentId)) {
        throw new AppError('Invalid equipmentId query parameter format.', 400);
      }
      query.equipmentId = new ObjectId(filters.equipmentId);
    }

    if (filters.branchId) {
      if (!ObjectId.isValid(filters.branchId)) {
        throw new AppError('Invalid branchId query parameter format.', 400);
      }
      query.branchId = new ObjectId(filters.branchId);
    }

    if (filters.status) {
      if (!MAINTENANCE_LOG_STATUSES.includes(filters.status as MaintenanceLogStatus)) {
        throw new AppError(
          `Invalid status filter. Allowed values: ${MAINTENANCE_LOG_STATUSES.join(', ')}`,
          400
        );
      }
      query.status = filters.status;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await db.collection('maintenanceLogs').countDocuments(query);
    const data = await db
      .collection<MaintenanceLogDocument>('maintenanceLogs')
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      count: data.length,
      total,
      page,
      limit,
      totalPages,
      data
    };
  }

  static async getMaintenanceLogById(
    tenantId: ObjectId,
    logId: ObjectId
  ): Promise<MaintenanceLogDocument> {
    const db = dbConnection.getDb();
    const log = await db.collection<MaintenanceLogDocument>('maintenanceLogs').findOne({
      _id: logId,
      organizationId: tenantId
    });

    if (!log) {
      throw new AppError('Maintenance log record not found in your organization.', 404);
    }

    return log;
  }

  static async updateMaintenanceLog(
    tenantId: ObjectId,
    userId: ObjectId,
    logId: ObjectId,
    data: UpdateMaintenanceLogDTO
  ): Promise<MaintenanceLogDocument> {
    const db = dbConnection.getDb();

    // Verify existence in tenant
    const existing = await this.getMaintenanceLogById(tenantId, logId);

    // Forbidden immutable fields check
    const rawAny = data as any;
    if (
      rawAny._id !== undefined ||
      rawAny.organizationId !== undefined ||
      rawAny.branchId !== undefined ||
      rawAny.equipmentId !== undefined
    ) {
      throw new AppError('Forbidden: _id, organizationId, branchId, and equipmentId are immutable fields.', 400);
    }

    const updateFields: Partial<MaintenanceLogDocument> = {};

    if (data.maintenanceType !== undefined) {
      if (typeof data.maintenanceType !== 'string' || !data.maintenanceType.trim()) {
        throw new AppError('maintenanceType cannot be empty.', 400);
      }
      updateFields.maintenanceType = data.maintenanceType.trim();
    }
    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || !data.description.trim()) {
        throw new AppError('description cannot be empty.', 400);
      }
      updateFields.description = data.description.trim();
    }
    if (data.performedBy !== undefined) {
      if (typeof data.performedBy !== 'string' || !data.performedBy.trim()) {
        throw new AppError('performedBy cannot be empty.', 400);
      }
      updateFields.performedBy = data.performedBy.trim();
    }
    if (data.maintenanceDate !== undefined) {
      if (!isValidDateFormat(data.maintenanceDate)) {
        throw new AppError('maintenanceDate must be in YYYY-MM-DD format.', 400);
      }
      updateFields.maintenanceDate = data.maintenanceDate;
    }
    if (data.nextMaintenanceDate !== undefined) {
      if (!isValidDateFormat(data.nextMaintenanceDate)) {
        throw new AppError('nextMaintenanceDate must be in YYYY-MM-DD format.', 400);
      }
      updateFields.nextMaintenanceDate = data.nextMaintenanceDate;
    }
    if (data.cost !== undefined) {
      if (typeof data.cost !== 'number' || !Number.isFinite(data.cost) || data.cost < 0) {
        throw new AppError('cost must be a valid finite number greater than or equal to 0.', 400);
      }
      updateFields.cost = data.cost;
    }

    if (Object.keys(updateFields).length === 0) {
      return existing;
    }

    await db.collection('maintenanceLogs').updateOne(
      { _id: logId, organizationId: tenantId },
      { $set: updateFields }
    );

    const updated = await this.getMaintenanceLogById(tenantId, logId);

    // Emit audit log
    await AuditLogService.logAction({
      tenantId,
      branchId: updated.branchId,
      userId,
      action: 'MAINTENANCE_UPDATED',
      entityType: 'maintenance',
      entityId: updated._id,
      description: `Maintenance log '${updated.maintenanceType}' (ID: ${logId.toHexString()}) details updated.`
    });

    return updated;
  }

  static async updateMaintenanceLogStatus(
    tenantId: ObjectId,
    userId: ObjectId,
    logId: ObjectId,
    newStatus: MaintenanceLogStatus
  ): Promise<MaintenanceLogDocument> {
    const db = dbConnection.getDb();

    // Verify existence in tenant
    const existing = await this.getMaintenanceLogById(tenantId, logId);

    if (!MAINTENANCE_LOG_STATUSES.includes(newStatus)) {
      throw new AppError(
        `Invalid maintenance status. Allowed values: ${MAINTENANCE_LOG_STATUSES.join(', ')}`,
        400
      );
    }

    if (existing.status === newStatus) {
      return existing;
    }

    await db.collection('maintenanceLogs').updateOne(
      { _id: logId, organizationId: tenantId },
      { $set: { status: newStatus } }
    );

    const updated = await this.getMaintenanceLogById(tenantId, logId);

    // Emit audit log
    await AuditLogService.logAction({
      tenantId,
      branchId: updated.branchId,
      userId,
      action: 'MAINTENANCE_STATUS_UPDATED',
      entityType: 'maintenance',
      entityId: updated._id,
      description: `Maintenance log (ID: ${logId.toHexString()}) status changed from '${existing.status}' to '${newStatus}'.`
    });

    return updated;
  }

  static async deleteMaintenanceLog(
    tenantId: ObjectId | undefined,
    logId: ObjectId
  ): Promise<boolean> {
    const db = dbConnection.getDb();
    const query: any = { _id: logId };
    if (tenantId) {
      query.organizationId = tenantId;
    }
    const result = await db.collection('maintenanceLogs').deleteOne(query);
    if (result.deletedCount === 0) {
      throw new AppError('Maintenance log not found or already deleted.', 404);
    }
    return true;
  }
}
