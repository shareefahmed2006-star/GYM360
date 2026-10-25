import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi } from '../api/branchApi';
import {
  CreateBranchDTO,
  UpdateBranchDTO,
  BranchStatus,
} from '../types/branch.types';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.listBranches(),
  });
};

export const useBranch = (branchId: string | undefined) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => {
      if (!branchId) throw new Error('Branch ID is required');
      return branchApi.getBranch(branchId);
    },
    enabled: !!branchId,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBranchDTO) => branchApi.createBranch(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      dto,
    }: {
      branchId: string;
      dto: UpdateBranchDTO;
    }) => branchApi.updateBranch(branchId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({
        queryKey: ['branch', variables.branchId],
      });
    },
  });
};

export const useUpdateBranchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      status,
    }: {
      branchId: string;
      status: BranchStatus;
    }) => branchApi.updateBranchStatus(branchId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({
        queryKey: ['branch', variables.branchId],
      });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchId: string) => branchApi.deleteBranch(branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};
