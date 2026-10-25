export type MembershipStatus = 'active' | 'expired' | 'cancelled';

export interface MembershipDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  memberId: string;
  planId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: MembershipStatus;
  autoRenew: boolean;
}

export interface CreateMembershipDTO {
  memberId: string;
  planId: string;
  branchId?: string; // Optional for admin, defaults to member's branch
  startDate?: string; // Optional, defaults to today (YYYY-MM-DD)
  autoRenew?: boolean;
}

export interface MembershipFilterParams {
  memberId?: string;
  status?: string;
  search?: string;
}

export interface ExpiringMembershipDocument extends MembershipDocument {
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  branchName: string;
  planName: string;
  planPrice: number;
  planDurationMonths: number;
  daysRemaining: number;
}

export interface RenewMembershipResponse {
  membership: MembershipDocument;
  payment: any;
}
