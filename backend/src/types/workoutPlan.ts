import { ObjectId, Int32 } from 'mongodb';

export type WorkoutPlanStatus = 'active' | 'inactive';

export interface WorkoutPlanDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  name: string;
  description: string;
  goal: string;
  difficulty: string;
  durationWeeks: Int32;
  createdBy: ObjectId;
  status: WorkoutPlanStatus;
}

export interface CreateWorkoutPlanDTO {
  name: string;
  description: string;
  goal: string;
  difficulty: string;
  durationWeeks: number;
}

export interface UpdateWorkoutPlanDTO {
  name?: string;
  description?: string;
  goal?: string;
  difficulty?: string;
  durationWeeks?: number;
  status?: WorkoutPlanStatus;
  // Disallowed / immutable identifiers
  _id?: never;
  organizationId?: never;
  createdBy?: never;
}

export interface WorkoutPlanQuery {
  goal?: string;
  difficulty?: string;
  status?: WorkoutPlanStatus;
}
