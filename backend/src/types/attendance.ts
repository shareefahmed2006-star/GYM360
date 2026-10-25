import { ObjectId } from 'mongodb';

export type AttendanceStatus = 'present' | 'absent';
export type AttendanceMethod = 'manual' | 'qr' | 'biometric';

export interface AttendanceDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  memberId: ObjectId;
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
}

export interface CheckInDTO {
  memberId?: string;
  branchId: string;
  method?: AttendanceMethod;
  checkInTime?: string;
}

export interface CheckOutDTO {
  memberId?: string;
  branchId?: string;
  checkOutTime?: string;
}

export interface ManualAttendanceDTO {
  memberId: string;
  branchId: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceQuery {
  branchId?: string;
  memberId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}
