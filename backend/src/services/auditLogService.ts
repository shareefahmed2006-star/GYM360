import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogDocument, LogActionParams, AuditLogFilterQuery } from '../types/auditLog';
import { getTodayUtcDateString } from '../utils/dateUtils';

export class AuditLogService {
  /**
   * Internal fail-safe audit logging action.
   * Conforms 100% to auditLogs $jsonSchema validator.
   * If insertion fails, logs clearly with console.error without crashing the primary business operation.
   */
  static async logAction(params: LogActionParams): Promise<void> {
    try {
      const db = dbConnection.getDb();
      const createdAt = params.createdAt || getTodayUtcDateString();

      const doc: Omit<AuditLogDocument, '_id'> = {
        organizationId: params.tenantId,
        branchId: params.branchId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        createdAt
      };

      await db.collection('auditLogs').insertOne(doc);
    } catch (err) {
      console.error('[AuditLogService] Failed to persist audit log entry:', err, {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId?.toHexString(),
        tenantId: params.tenantId?.toHexString()
      });
    }
  }

  /**
   * Query audit logs with tenant isolation and database-level pagination.
   */
  static async listAuditLogs(
    tenantId: ObjectId,
    filters: AuditLogFilterQuery
  ): Promise<{
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: AuditLogDocument[];
  }> {
    const db = dbConnection.getDb();
    const query: any = tenantId ? { organizationId: tenantId } : {};

    if (filters.branchId) {
      if (!ObjectId.isValid(filters.branchId)) {
        throw new AppError('Invalid branchId format in query filter.', 400);
      }
      query.branchId = new ObjectId(filters.branchId);
    }

    if (filters.entityType && typeof filters.entityType === 'string' && filters.entityType.trim()) {
      query.entityType = filters.entityType.trim();
    }

    if (filters.entityId) {
      if (!ObjectId.isValid(filters.entityId)) {
        throw new AppError('Invalid entityId format in query filter.', 400);
      }
      query.entityId = new ObjectId(filters.entityId);
    }

    if (filters.action && typeof filters.action === 'string' && filters.action.trim()) {
      query.action = filters.action.trim();
    }

    if (filters.userId) {
      if (!ObjectId.isValid(filters.userId)) {
        throw new AppError('Invalid userId format in query filter.', 400);
      }
      query.userId = new ObjectId(filters.userId);
    }

    if (filters.date && typeof filters.date === 'string' && filters.date.trim()) {
      query.createdAt = filters.date.trim();
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await db.collection('auditLogs').countDocuments(query);
    const data = await db
      .collection<AuditLogDocument>('auditLogs')
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
}
