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

export interface TrainerDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string[];
  experienceYears: number;
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
}

export interface TrainerFilterParams {
  branchId?: string;
  status?: TrainerStatus;
  specialization?: string;
}

export interface TrainerAvailabilityDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  trainerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
}
