import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  EquipmentDocument,
  EquipmentStatus,
  EQUIPMENT_STATUSES,
  CreateEquipmentDTO,
  UpdateEquipmentDTO,
  EquipmentFilterQuery
} from '../types/equipment';
import { AuditLogService } from './auditLogService';

const isValidDateFormat = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

export class EquipmentService {
  static async createEquipment(
    tenantId: ObjectId,
    userId: ObjectId,
    data: CreateEquipmentDTO
  ): Promise<EquipmentDocument> {
    const db = dbConnection.getDb();

    // 1. Validate branch existence and tenant ownership
    if (!data.branchId || !ObjectId.isValid(data.branchId)) {
      throw new AppError('Valid branchId format is required.', 400);
    }
    const branchObjectId = new ObjectId(data.branchId);
    const branch = await db.collection('branches').findOne({
      _id: branchObjectId,
      organizationId: tenantId
    });
    if (!branch) {
      throw new AppError('Branch not found or does not belong to your organization.', 404);
    }

    // 2. Validate required string fields
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      throw new AppError('Equipment name is required.', 400);
    }
    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      throw new AppError('Equipment category is required.', 400);
    }
    if (!data.brand || typeof data.brand !== 'string' || !data.brand.trim()) {
      throw new AppError('Equipment brand is required.', 400);
    }
    if (!data.model || typeof data.model !== 'string' || !data.model.trim()) {
      throw new AppError('Equipment model is required.', 400);
    }
    if (!data.serialNumber || typeof data.serialNumber !== 'string' || !data.serialNumber.trim()) {
      throw new AppError('Equipment serialNumber is required.', 400);
    }

    // 3. Validate date formats
    if (!data.purchaseDate || !isValidDateFormat(data.purchaseDate)) {
      throw new AppError('purchaseDate is required and must be in YYYY-MM-DD format.', 400);
    }
    if (!data.lastMaintenanceDate || !isValidDateFormat(data.lastMaintenanceDate)) {
      throw new AppError('lastMaintenanceDate is required and must be in YYYY-MM-DD format.', 400);
    }
    if (!data.nextMaintenanceDate || !isValidDateFormat(data.nextMaintenanceDate)) {
      throw new AppError('nextMaintenanceDate is required and must be in YYYY-MM-DD format.', 400);
    }

    // 4. Validate status enum
    const status: EquipmentStatus = data.status || 'operational';
    if (!EQUIPMENT_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid equipment status. Allowed values: ${EQUIPMENT_STATUSES.join(', ')}`,
        400
      );
    }

    // 5. Build and insert document conforming strictly to equipment schema
    const newDoc: Omit<EquipmentDocument, '_id'> = {
      organizationId: tenantId,
      branchId: branchObjectId,
      name: data.name.trim(),
      category: data.category.trim(),
      brand: data.brand.trim(),
      model: data.model.trim(),
      serialNumber: data.serialNumber.trim(),
      purchaseDate: data.purchaseDate,
      status,
      lastMaintenanceDate: data.lastMaintenanceDate,
      nextMaintenanceDate: data.nextMaintenanceDate
    };

    const insertResult = await db.collection<EquipmentDocument>('equipment').insertOne(newDoc as EquipmentDocument);
    const createdEquipment: EquipmentDocument = {
      ...newDoc,
      _id: insertResult.insertedId
    };

    // 6. Emit audit log
    await AuditLogService.logAction({
      tenantId,
      branchId: branchObjectId,
      userId,
      action: 'EQUIPMENT_CREATED',
      entityType: 'equipment',
      entityId: createdEquipment._id,
      description: `Equipment '${createdEquipment.name}' (S/N: ${createdEquipment.serialNumber}) registered at branch.`
    });

    return createdEquipment;
  }

  static async listEquipment(
    tenantId: ObjectId | undefined,
    filters: EquipmentFilterQuery
  ): Promise<{
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: EquipmentDocument[];
  }> {
    const db = dbConnection.getDb();
    const query: any = tenantId ? { organizationId: tenantId } : {};

    if (filters.branchId) {
      if (!ObjectId.isValid(filters.branchId)) {
        throw new AppError('Invalid branchId query parameter format.', 400);
      }
      query.branchId = new ObjectId(filters.branchId);
    }

    if (filters.status) {
      if (!EQUIPMENT_STATUSES.includes(filters.status as EquipmentStatus)) {
        throw new AppError(
          `Invalid status filter. Allowed values: ${EQUIPMENT_STATUSES.join(', ')}`,
          400
        );
      }
      query.status = filters.status;
    }

    if (filters.category && typeof filters.category === 'string' && filters.category.trim()) {
      query.category = filters.category.trim();
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await db.collection('equipment').countDocuments(query);
    const data = await db
      .collection<EquipmentDocument>('equipment')
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

  static async getEquipmentById(
    tenantId: ObjectId,
    equipmentId: ObjectId
  ): Promise<EquipmentDocument> {
    const db = dbConnection.getDb();
    const equipment = await db.collection<EquipmentDocument>('equipment').findOne({
      _id: equipmentId,
      organizationId: tenantId
    });

    if (!equipment) {
      throw new AppError('Equipment record not found in your organization.', 404);
    }

    return equipment;
  }

  static async updateEquipment(
    tenantId: ObjectId,
    userId: ObjectId,
    equipmentId: ObjectId,
    data: UpdateEquipmentDTO
  ): Promise<EquipmentDocument> {
    const db = dbConnection.getDb();

    // Verify existence in tenant
    const existing = await this.getEquipmentById(tenantId, equipmentId);

    // Forbidden immutable fields check
    const rawAny = data as any;
    if (rawAny._id !== undefined || rawAny.organizationId !== undefined || rawAny.branchId !== undefined) {
      throw new AppError('Forbidden: _id, organizationId, and branchId are immutable fields.', 400);
    }

    const updateFields: Partial<EquipmentDocument> = {};

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || !data.name.trim()) {
        throw new AppError('Equipment name cannot be empty.', 400);
      }
      updateFields.name = data.name.trim();
    }
    if (data.category !== undefined) {
      if (typeof data.category !== 'string' || !data.category.trim()) {
        throw new AppError('Equipment category cannot be empty.', 400);
      }
      updateFields.category = data.category.trim();
    }
    if (data.brand !== undefined) {
      if (typeof data.brand !== 'string' || !data.brand.trim()) {
        throw new AppError('Equipment brand cannot be empty.', 400);
      }
      updateFields.brand = data.brand.trim();
    }
    if (data.model !== undefined) {
      if (typeof data.model !== 'string' || !data.model.trim()) {
        throw new AppError('Equipment model cannot be empty.', 400);
      }
      updateFields.model = data.model.trim();
    }
    if (data.serialNumber !== undefined) {
      if (typeof data.serialNumber !== 'string' || !data.serialNumber.trim()) {
        throw new AppError('Equipment serialNumber cannot be empty.', 400);
      }
      updateFields.serialNumber = data.serialNumber.trim();
    }
    if (data.purchaseDate !== undefined) {
      if (!isValidDateFormat(data.purchaseDate)) {
        throw new AppError('purchaseDate must be in YYYY-MM-DD format.', 400);
      }
      updateFields.purchaseDate = data.purchaseDate;
    }
    if (data.lastMaintenanceDate !== undefined) {
      if (!isValidDateFormat(data.lastMaintenanceDate)) {
        throw new AppError('lastMaintenanceDate must be in YYYY-MM-DD format.', 400);
      }
      updateFields.lastMaintenanceDate = data.lastMaintenanceDate;
    }
    if (data.nextMaintenanceDate !== undefined) {
      if (!isValidDateFormat(data.nextMaintenanceDate)) {
        throw new AppError('nextMaintenanceDate must be in YYYY-MM-DD format.', 400);
      }
      updateFields.nextMaintenanceDate = data.nextMaintenanceDate;
    }

    if (Object.keys(updateFields).length === 0) {
      return existing;
    }

    await db.collection('equipment').updateOne(
      { _id: equipmentId, organizationId: tenantId },
      { $set: updateFields }
    );

    const updated = await this.getEquipmentById(tenantId, equipmentId);

    // Emit audit log
    await AuditLogService.logAction({
      tenantId,
      branchId: updated.branchId,
      userId,
      action: 'EQUIPMENT_UPDATED',
      entityType: 'equipment',
      entityId: updated._id,
      description: `Equipment '${updated.name}' details updated.`
    });

    return updated;
  }

  static async updateEquipmentStatus(
    tenantId: ObjectId,
    userId: ObjectId,
    equipmentId: ObjectId,
    newStatus: EquipmentStatus
  ): Promise<EquipmentDocument> {
    const db = dbConnection.getDb();

    // Verify existence in tenant
    const existing = await this.getEquipmentById(tenantId, equipmentId);

    if (!EQUIPMENT_STATUSES.includes(newStatus)) {
      throw new AppError(
        `Invalid equipment status. Allowed values: ${EQUIPMENT_STATUSES.join(', ')}`,
        400
      );
    }

    if (existing.status === newStatus) {
      return existing;
    }

    await db.collection('equipment').updateOne(
      { _id: equipmentId, organizationId: tenantId },
      { $set: { status: newStatus } }
    );

    const updated = await this.getEquipmentById(tenantId, equipmentId);

    // Emit audit log
    await AuditLogService.logAction({
      tenantId,
      branchId: updated.branchId,
      userId,
      action: 'EQUIPMENT_STATUS_UPDATED',
      entityType: 'equipment',
      entityId: updated._id,
      description: `Equipment '${updated.name}' status changed from '${existing.status}' to '${newStatus}'.`
    });

    return updated;
  }

  static async deleteEquipment(
    tenantId: ObjectId | undefined,
    equipmentId: ObjectId
  ): Promise<boolean> {
    const db = dbConnection.getDb();
    const query: any = { _id: equipmentId };
    if (tenantId) {
      query.organizationId = tenantId;
    }
    const result = await db.collection('equipment').deleteOne(query);
    if (result.deletedCount === 0) {
      throw new AppError('Equipment not found or already deleted', 404);
    }
    return true;
  }
}
