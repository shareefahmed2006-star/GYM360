import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '../api/memberApi';
import {
  CreateMemberDTO,
  AdminUpdateMemberDTO,
  MemberStatus,
} from '../types/member.types';

export const useMembers = (branchId?: string) => {
  return useQuery({
    queryKey: ['members', branchId ?? 'all'],
    queryFn: () => memberApi.listMembers(branchId),
  });
};

export const useMember = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: () => {
      if (!memberId) throw new Error('Member ID is required');
      return memberApi.getMember(memberId);
    },
    enabled: !!memberId,
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMemberDTO) => memberApi.createMember(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      dto,
    }: {
      memberId: string;
      dto: AdminUpdateMemberDTO;
    }) => memberApi.updateMember(memberId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({
        queryKey: ['member', variables.memberId],
      });
    },
  });
};

export const useUpdateMemberStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string;
      status: MemberStatus;
    }) => memberApi.updateMemberStatus(memberId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({
        queryKey: ['member', variables.memberId],
      });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => memberApi.deleteMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};
