import { apiClient } from './apiClient';
import {
  MembershipPlanDocument,
  CreateMembershipPlanDTO,
  UpdateMembershipPlanDTO,
  PlanStatus,
} from '../types/membershipPlan.types';

export const membershipPlanApi = {
  listPlans: async (): Promise<MembershipPlanDocument[]> => {
    const res = await apiClient<{ plans: MembershipPlanDocument[] }>(
      '/membership-plans',
      { method: 'GET' }
    );
    if (!res.data?.plans) {
      throw new Error('Membership plans array missing from response.');
    }
    return res.data.plans;
  },

  getPlan: async (planId: string): Promise<MembershipPlanDocument> => {
    const res = await apiClient<{ plan: MembershipPlanDocument }>(
      `/membership-plans/${planId}`,
      { method: 'GET' }
    );
    if (!res.data?.plan) {
      throw new Error('Membership plan details missing from response.');
    }
    return res.data.plan;
  },

  createPlan: async (
    dto: CreateMembershipPlanDTO
  ): Promise<MembershipPlanDocument> => {
    const res = await apiClient<{ plan: MembershipPlanDocument }>(
      '/membership-plans',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    if (!res.data?.plan) {
      throw new Error('Created membership plan data missing from response.');
    }
    return res.data.plan;
  },

  updatePlan: async (
    planId: string,
    dto: UpdateMembershipPlanDTO
  ): Promise<MembershipPlanDocument> => {
    const res = await apiClient<{ plan: MembershipPlanDocument }>(
      `/membership-plans/${planId}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    );
    if (!res.data?.plan) {
      throw new Error('Updated membership plan data missing from response.');
    }
    return res.data.plan;
  },

  updatePlanStatus: async (
    planId: string,
    status: PlanStatus
  ): Promise<MembershipPlanDocument> => {
    const res = await apiClient<{ plan: MembershipPlanDocument }>(
      `/membership-plans/${planId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    if (!res.data?.plan) {
      throw new Error('Membership plan status update missing from response.');
    }
    return res.data.plan;
  },

  deletePlan: async (planId: string): Promise<boolean> => {
    await apiClient(`/membership-plans/${planId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
