import { ObjectId, Int32 } from 'mongodb';

export type BranchAccessTier = 'single_branch' | 'all_branches';

export interface MembershipPlanDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  name: string;
  description: string;
  durationDays: Int32 | number;
  price: number;
  branchAccess: BranchAccessTier;
  status: 'active' | 'inactive';
}

export interface CreateMembershipPlanDTO {
  name: string;
  description: string;
  durationDays: number;
  price: number;
  branchAccess: BranchAccessTier;
}

export interface UpdateMembershipPlanDTO {
  name?: string;
  description?: string;
  durationDays?: number;
  price?: number;
  branchAccess?: BranchAccessTier;
  status?: 'active' | 'inactive';
}
