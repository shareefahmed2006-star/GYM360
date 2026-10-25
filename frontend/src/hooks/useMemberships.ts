import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipApi } from '../api/membershipApi';
import { CreateMembershipDTO } from '../types/membership.types';

export const useMemberships = (memberId?: string) => {
  return useQuery({
    queryKey: ['memberships', memberId ?? 'all'],
    queryFn: () => membershipApi.listMemberships(memberId),
  });
};

export const useMembership = (membershipId: string | undefined) => {
  return useQuery({
    queryKey: ['membership', membershipId],
    queryFn: () => {
      if (!membershipId) throw new Error('Membership ID is required');
      return membershipApi.getMembership(membershipId);
    },
    enabled: !!membershipId,
  });
};

export const useCreateMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMembershipDTO) => membershipApi.createMembership(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      if (variables.memberId) {
        queryClient.invalidateQueries({ queryKey: ['memberships', variables.memberId] });
      }
    },
  });
};

export const useCancelMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) => membershipApi.cancelMembership(membershipId),
    onSuccess: (data, membershipId) => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['membership', membershipId] });
      if (data?.memberId) {
        queryClient.invalidateQueries({ queryKey: ['memberships', data.memberId] });
      }
    },
  });
};

export const useExpiringMemberships = (daysAhead: number = 7) => {
  return useQuery({
    queryKey: ['memberships', 'expiring', daysAhead],
    queryFn: () => membershipApi.getExpiringMemberships(daysAhead),
  });
};

export const useRenewMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      membershipId,
      paymentMethod,
    }: {
      membershipId: string;
      paymentMethod?: string;
    }) => membershipApi.renewMembership(membershipId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) => membershipApi.deleteMembership(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
};
