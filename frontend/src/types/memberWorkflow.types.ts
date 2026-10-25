export type MemberWorkoutPlanStatus = 'active' | 'inactive' | 'completed';

export interface MemberWorkoutPlanDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  memberId: string;
  workoutPlanId: string;
  assignedBy: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: MemberWorkoutPlanStatus;
  notes: string;
}

export interface WorkoutPlanDocument {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  goal: string;
  difficulty: string;
  durationWeeks: number;
  status: 'active' | 'inactive';
}

export interface MemberWorkoutPlanWithDetails {
  assignment: MemberWorkoutPlanDocument;
  plan?: WorkoutPlanDocument;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface TrainerSessionDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  trainerId: string;
  memberId: string;
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
  sessionDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  sessionType: string;
  notes?: string;
}
