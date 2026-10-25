export type MaintenanceLogStatus = 'completed' | 'scheduled' | 'cancelled';

export const MAINTENANCE_LOG_STATUSES: MaintenanceLogStatus[] = [
  'completed',
  'scheduled',
  'cancelled',
];

export interface MaintenanceLogDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  equipmentId: string;
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
  maintenanceType?: string;
  description?: string;
  performedBy?: string;
  cost?: number;
  maintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface UpdateMaintenanceLogStatusDTO {
  status: MaintenanceLogStatus;
}

export interface MaintenanceLogFilterParams {
  equipmentId?: string;
  branchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface MaintenanceLogListResponse {
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: MaintenanceLogDocument[];
}
