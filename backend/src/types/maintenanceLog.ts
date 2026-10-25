import { ObjectId } from 'mongodb';

export type MaintenanceLogStatus = 'completed' | 'scheduled' | 'cancelled';

export const MAINTENANCE_LOG_STATUSES: MaintenanceLogStatus[] = [
  'completed',
  'scheduled',
  'cancelled'
];

export interface MaintenanceLogDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  equipmentId: ObjectId;
  maintenanceDate: string; // YYYY-MM-DD
  maintenanceType: string;
  description: string;
  performedBy: string;
  cost: number;
  status: MaintenanceLogStatus;
  nextMaintenanceDate: string; // YYYY-MM-DD
}

export interface CreateMaintenanceLogDTO {
  equipmentId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string;
  performedBy: string;
  cost: number;
  status?: MaintenanceLogStatus;
  nextMaintenanceDate: string;
}

export interface UpdateMaintenanceLogDTO {
  maintenanceDate?: string;
  maintenanceType?: string;
  description?: string;
  performedBy?: string;
  cost?: number;
  nextMaintenanceDate?: string;
}

export interface UpdateMaintenanceLogStatusDTO {
  status: MaintenanceLogStatus;
}

export interface MaintenanceLogFilterQuery {
  equipmentId?: string;
  branchId?: string;
  status?: string;
  page?: string | number;
  limit?: string | number;
}
