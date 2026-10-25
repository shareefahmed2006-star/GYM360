import { ObjectId } from 'mongodb';

export type MemberWorkoutPlanStatus = 'active' | 'inactive' | 'completed';

export interface MemberWorkoutPlanDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  memberId: ObjectId;
  workoutPlanId: ObjectId;
  assignedBy: ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: MemberWorkoutPlanStatus;
  notes: string;
}

export interface CreateMemberWorkoutPlanDTO {
  memberId: string;
  workoutPlanId: string;
  startDate: string;
  notes?: string;
  branchId?: string; // Optional client field that will be overridden by member.branchId
}

export interface UpdateMemberWorkoutPlanStatusDTO {
  status: MemberWorkoutPlanStatus;
}

export interface MemberWorkoutPlanQuery {
  memberId?: string;
  branchId?: string;
  status?: MemberWorkoutPlanStatus;
  page?: number;
  limit?: number;
}
