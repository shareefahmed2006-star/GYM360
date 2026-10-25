import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipPlanApi } from '../api/membershipPlanApi';
import {
  CreateMembershipPlanDTO,
  UpdateMembershipPlanDTO,
  PlanStatus,
} from '../types/membershipPlan.types';

export const useMembershipPlans = () => {
  return useQuery({
    queryKey: ['membershipPlans'],
    queryFn: () => membershipPlanApi.listPlans(),
  });
};

export const useMembershipPlan = (planId: string | undefined) => {
  return useQuery({
    queryKey: ['membershipPlan', planId],
    queryFn: () => {
      if (!planId) throw new Error('Plan ID is required');
      return membershipPlanApi.getPlan(planId);
    },
    enabled: !!planId,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMembershipPlanDTO) =>
      membershipPlanApi.createPlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      dto,
    }: {
      planId: string;
      dto: UpdateMembershipPlanDTO;
    }) => membershipPlanApi.updatePlan(planId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
      queryClient.invalidateQueries({
        queryKey: ['membershipPlan', variables.planId],
      });
    },
  });
};

export const useUpdatePlanStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      status,
    }: {
      planId: string;
      status: PlanStatus;
    }) => membershipPlanApi.updatePlanStatus(planId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
      queryClient.invalidateQueries({
        queryKey: ['membershipPlan', variables.planId],
      });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => membershipPlanApi.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
};
