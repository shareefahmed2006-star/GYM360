import { ObjectId } from 'mongodb';

export type MembershipStatus = 'active' | 'expired' | 'cancelled';

export interface MembershipDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  memberId: ObjectId;
  planId: ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: MembershipStatus;
  autoRenew: boolean;
}

export interface CreateMembershipDTO {
  memberId: string;
  planId: string;
  branchId?: string; // Optional for admin, locked to home branch for member self-enrollment
  startDate?: string; // Optional, defaults to today's UTC date
  autoRenew?: boolean;
}
