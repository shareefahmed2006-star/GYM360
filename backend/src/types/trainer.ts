import { ObjectId, Int32 } from 'mongodb';

export type TrainerStatus = 'active' | 'inactive';
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';
export type AvailabilityStatus = 'available' | 'unavailable';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface TrainerDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string[];
  experienceYears: Int32;
  bio: string;
  status: TrainerStatus;
}

export interface CreateTrainerDTO {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string[];
  experienceYears: number;
  bio: string;
}

export interface UpdateTrainerDTO {
  branchId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialization?: string[];
  experienceYears?: number;
  bio?: string;
  status?: TrainerStatus;
  // Disallowed fields will be rejected
  email?: never;
  organizationId?: never;
  _id?: never;
}

export interface TrainerAvailabilityDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  trainerId: ObjectId;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
}

export interface CreateAvailabilityDTO {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  status?: AvailabilityStatus;
}

export interface UpdateAvailabilityStatusDTO {
  status: AvailabilityStatus;
}

export interface TrainerSessionDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  trainerId: ObjectId;
  memberId: ObjectId;
  sessionDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  sessionType: string;
  status: SessionStatus;
  notes: string;
}

export interface BookSessionDTO {
  trainerId: string;
  memberId?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  notes?: string;
}

export interface UpdateSessionStatusDTO {
  status: SessionStatus;
}

export interface TrainerQuery {
  branchId?: string;
  status?: TrainerStatus;
  specialization?: string;
}

export interface SessionQuery {
  trainerId?: string;
  memberId?: string;
  sessionDate?: string;
  status?: SessionStatus;
  branchId?: string;
  page?: number;
  limit?: number;
}
