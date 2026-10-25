import { apiClient } from './apiClient';
import {
  MembershipDocument,
  CreateMembershipDTO,
  ExpiringMembershipDocument,
  RenewMembershipResponse,
} from '../types/membership.types';

export const membershipApi = {
  /**
   * List all memberships in tenant or filter by memberId.
   */
  listMemberships: async (memberId?: string): Promise<MembershipDocument[]> => {
    const params = memberId ? { memberId } : undefined;
    const response = await apiClient<{ memberships: MembershipDocument[] }>(
      '/memberships',
      {
        method: 'GET',
        params,
      }
    );
    return response.data?.memberships || [];
  },

  /**
   * Get expiring memberships (within daysAhead, defaults to 7 days).
   */
  getExpiringMemberships: async (daysAhead: number = 7): Promise<ExpiringMembershipDocument[]> => {
    const response = await apiClient<any>(
      '/memberships/expiring-soon',
      {
        method: 'GET',
        params: { daysAhead },
      }
    );
    const d = response.data;
    if (Array.isArray(d)) return d;
    return d?.expiringMemberships || response.data?.expiringMemberships || [];
  },

  /**
   * 1-Click Renew membership.
   */
  renewMembership: async (
    membershipId: string,
    paymentMethod: string = 'upi'
  ): Promise<RenewMembershipResponse> => {
    const response = await apiClient<any>(
      `/memberships/${membershipId}/renew`,
      {
        method: 'POST',
        body: JSON.stringify({ paymentMethod }),
      }
    );
    const resData = response.data || response;
    if (!resData?.membership) {
      throw new Error('Failed to renew membership.');
    }
    return resData;
  },

  /**
   * Get single membership by ID.
   */
  getMembership: async (membershipId: string): Promise<MembershipDocument> => {
    const response = await apiClient<{ membership: MembershipDocument }>(
      `/memberships/${membershipId}`,
      {
        method: 'GET',
      }
    );
    if (!response.data?.membership) {
      throw new Error('Membership record was not returned by the server.');
    }
    return response.data.membership;
  },

  /**
   * Create/enroll member into a subscription.
   */
  createMembership: async (
    dto: CreateMembershipDTO
  ): Promise<MembershipDocument> => {
    const response = await apiClient<{ membership: MembershipDocument }>(
      '/memberships',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    if (!response.data?.membership) {
      throw new Error('Failed to create membership subscription.');
    }
    return response.data.membership;
  },

  /**
   * Cancel an active membership subscription.
   */
  cancelMembership: async (
    membershipId: string
  ): Promise<MembershipDocument> => {
    const response = await apiClient<{ membership: MembershipDocument }>(
      `/memberships/${membershipId}/cancel`,
      {
        method: 'PATCH',
      }
    );
    if (!response.data?.membership) {
      throw new Error('Failed to cancel membership subscription.');
    }
    return response.data.membership;
  },

  /**
   * Permanently delete a membership subscription from the database.
   */
  deleteMembership: async (membershipId: string): Promise<boolean> => {
    await apiClient(`/memberships/${membershipId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
