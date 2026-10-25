import { apiClient } from './apiClient';
import {
  MemberDocument,
  CreateMemberDTO,
  AdminUpdateMemberDTO,
  MemberStatus,
} from '../types/member.types';

export const memberApi = {
  listMembers: async (branchId?: string): Promise<MemberDocument[]> => {
    const res = await apiClient<{ members: MemberDocument[] }>('/members', {
      method: 'GET',
      params: branchId ? { branchId } : undefined,
    });
    if (!res.data?.members) {
      throw new Error('Members array missing from response.');
    }
    return res.data.members;
  },

  getMember: async (memberId: string): Promise<MemberDocument> => {
    const res = await apiClient<{ member: MemberDocument }>(`/members/${memberId}`, {
      method: 'GET',
    });
    if (!res.data?.member) {
      throw new Error('Member profile missing from response.');
    }
    return res.data.member;
  },

  createMember: async (dto: CreateMemberDTO): Promise<MemberDocument> => {
    const res = await apiClient<{ member: MemberDocument }>('/members', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (!res.data?.member) {
      throw new Error('Created member data missing from response.');
    }
    return res.data.member;
  },

  updateMember: async (
    memberId: string,
    dto: AdminUpdateMemberDTO
  ): Promise<MemberDocument> => {
    const res = await apiClient<{ member: MemberDocument }>(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (!res.data?.member) {
      throw new Error('Updated member data missing from response.');
    }
    return res.data.member;
  },

  updateMemberStatus: async (
    memberId: string,
    status: MemberStatus
  ): Promise<MemberDocument> => {
    const res = await apiClient<{ member: MemberDocument }>(
      `/members/${memberId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    if (!res.data?.member) {
      throw new Error('Member status update response missing data.');
    }
    return res.data.member;
  },

  deleteMember: async (memberId: string): Promise<boolean> => {
    await apiClient(`/members/${memberId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
