export type AttendanceStatus = 'present' | 'absent';
export type AttendanceMethod = 'manual' | 'qr' | 'biometric';

export interface AttendanceDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  memberId: string;
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
}

export interface CheckInDTO {
  memberId: string;
  branchId: string;
  method?: AttendanceMethod;
  checkInTime?: string;
}

export interface CheckOutDTO {
  memberId: string;
  branchId?: string;
  checkOutTime?: string;
}

export interface AttendanceFilterParams {
  branchId?: string;
  memberId?: string;
  date?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AttendanceListResponse {
  count: number;
  data: AttendanceDocument[];
}
