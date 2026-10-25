import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  MemberWorkoutPlanDocument,
  WorkoutPlanDocument,
  TrainerSessionDocument,
  BookSessionDTO,
} from '../types/memberWorkflow.types';

export const memberWorkflowApi = {
  /**
   * List assigned workout plans for the authenticated member.
   */
  listMemberWorkouts: async (): Promise<MemberWorkoutPlanDocument[]> => {
    const res = await apiClient<MemberWorkoutPlanDocument[]>('/member-workout-plans', {
      method: 'GET',
    });
    if (!Array.isArray(res.data)) {
      throw new ApiError('Expected array of assigned workout plans.', 500);
    }
    return res.data;
  },

  /**
   * Get master workout plan details.
   */
  getWorkoutPlanDetails: async (planId: string): Promise<WorkoutPlanDocument> => {
    const res = await apiClient<WorkoutPlanDocument>(`/workout-plans/${planId}`, {
      method: 'GET',
    });
    if (!res.data || !res.data._id) {
      throw new ApiError('Workout plan details not found.', 404);
    }
    return res.data;
  },

  /**
   * Mark an active workout plan assignment as completed by member.
   */
  completeWorkoutAssignment: async (
    assignmentId: string
  ): Promise<MemberWorkoutPlanDocument> => {
    const res = await apiClient<MemberWorkoutPlanDocument>(
      `/member-workout-plans/${assignmentId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      }
    );
    if (!res.data) {
      throw new ApiError('Failed to complete workout plan assignment.', 500);
    }
    return res.data;
  },

  /**
   * List trainer sessions booked for the authenticated member.
   */
  listMemberSessions: async (): Promise<TrainerSessionDocument[]> => {
    const res = await apiClient<TrainerSessionDocument[]>('/trainer-sessions', {
      method: 'GET',
    });
    if (!Array.isArray(res.data)) {
      throw new ApiError('Expected array of trainer sessions.', 500);
    }
    return res.data;
  },

  /**
   * Book a training session with a trainer.
   */
  bookTrainerSession: async (dto: BookSessionDTO): Promise<TrainerSessionDocument> => {
    const res = await apiClient<TrainerSessionDocument>('/trainer-sessions', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (!res.data) {
      throw new ApiError('Failed to book training session.', 500);
    }
    return res.data;
  },

  /**
   * Cancel a scheduled trainer session.
   */
  cancelTrainerSession: async (sessionId: string): Promise<TrainerSessionDocument> => {
    const res = await apiClient<TrainerSessionDocument>(
      `/trainer-sessions/${sessionId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }
    );
    if (!res.data) {
      throw new ApiError('Failed to cancel trainer session.', 500);
    }
    return res.data;
  },
};
