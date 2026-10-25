export type EquipmentStatus = 'operational' | 'under_maintenance' | 'out_of_service';

export const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'operational',
  'under_maintenance',
  'out_of_service',
];

export interface EquipmentDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  status: EquipmentStatus;
  lastMaintenanceDate: string; // YYYY-MM-DD
  nextMaintenanceDate: string; // YYYY-MM-DD
}

export interface CreateEquipmentDTO {
  branchId: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  status?: EquipmentStatus;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
}

export interface UpdateEquipmentDTO {
  name?: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface UpdateEquipmentStatusDTO {
  status: EquipmentStatus;
}

export interface EquipmentFilterParams {
  branchId?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface EquipmentListResponse {
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: EquipmentDocument[];
}
