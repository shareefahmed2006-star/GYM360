import { apiClient } from './apiClient';
import {
  BranchDocument,
  CreateBranchDTO,
  UpdateBranchDTO,
  BranchStatus,
} from '../types/branch.types';

export const branchApi = {
  listBranches: async (): Promise<BranchDocument[]> => {
    const res = await apiClient<{ branches: BranchDocument[] }>('/branches', {
      method: 'GET',
    });
    if (!res.data?.branches) {
      throw new Error('Branches array missing from response.');
    }
    return res.data.branches;
  },

  getBranch: async (branchId: string): Promise<BranchDocument> => {
    const res = await apiClient<{ branch: BranchDocument }>(`/branches/${branchId}`, {
      method: 'GET',
    });
    if (!res.data?.branch) {
      throw new Error('Branch data missing from response.');
    }
    return res.data.branch;
  },

  createBranch: async (dto: CreateBranchDTO): Promise<BranchDocument> => {
    const res = await apiClient<{ branch: BranchDocument }>('/branches', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (!res.data?.branch) {
      throw new Error('Created branch data missing from response.');
    }
    return res.data.branch;
  },

  updateBranch: async (
    branchId: string,
    dto: UpdateBranchDTO
  ): Promise<BranchDocument> => {
    const res = await apiClient<{ branch: BranchDocument }>(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (!res.data?.branch) {
      throw new Error('Updated branch data missing from response.');
    }
    return res.data.branch;
  },

  updateBranchStatus: async (
    branchId: string,
    status: BranchStatus
  ): Promise<BranchDocument> => {
    const res = await apiClient<{ branch: BranchDocument }>(
      `/branches/${branchId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    if (!res.data?.branch) {
      throw new Error('Branch status update data missing from response.');
    }
    return res.data.branch;
  },

  deleteBranch: async (branchId: string): Promise<boolean> => {
    await apiClient(`/branches/${branchId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
