import { ObjectId } from 'mongodb';
import { AuthenticatedRequest } from './auth';

// FUTURE ONLY: The existing Users validator in MongoDB strictly enforces role: ['admin', 'member'].
// Trainer authorization will be implemented in Milestone 8. Do not use for active accounts in Milestone 3.
export type FutureTrainerRole = 'trainer';

export interface BranchSummary {
  _id: ObjectId;
  organizationId: ObjectId;
  name: string;
  status: string;
}

export interface MemberSummary {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  status: string;
}

export interface AuthorizedRequest extends AuthenticatedRequest {
  tenantId?: ObjectId;
  branchId?: ObjectId;
  branch?: BranchSummary;
  member?: MemberSummary;
}
