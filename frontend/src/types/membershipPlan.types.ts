export type BranchAccessTier = 'single_branch' | 'all_branches';
export type PlanStatus = 'active' | 'inactive';

export interface MembershipPlanDocument {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  branchAccess: BranchAccessTier;
  status: PlanStatus;
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
  status?: PlanStatus;
}
