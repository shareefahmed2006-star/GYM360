import { ObjectId } from 'mongodb';

export interface AuditLogDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  userId: ObjectId;
  action: string;
  entityType: string;
  entityId: ObjectId;
  description: string;
  createdAt: string; // YYYY-MM-DD
}

export interface LogActionParams {
  tenantId: ObjectId;
  branchId: ObjectId;
  userId: ObjectId;
  action: string;
  entityType: string;
  entityId: ObjectId;
  description: string;
  createdAt?: string;
}

export interface AuditLogFilterQuery {
  branchId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  date?: string;
  page?: string | number;
  limit?: string | number;
}
