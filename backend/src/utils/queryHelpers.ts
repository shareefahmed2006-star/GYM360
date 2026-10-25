import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { AppError } from '../middleware/errorHandler';

/**
 * Injects verified tenant organizationId into any MongoDB query filter.
 * Prevents accidental omission of tenant scoping in database calls.
 */
export const withTenant = <T extends Record<string, any>>(
  req: AuthorizedRequest,
  filter: T = {} as T
): T & { organizationId: ObjectId } => {
  const orgId = req.tenantId || (req.user?.organizationId ? new ObjectId(req.user.organizationId) : null);

  if (!orgId) {
    throw new AppError('Tenant context is missing from request.', 500);
  }

  return {
    ...filter,
    organizationId: orgId
  };
};

/**
 * Injects verified tenant organizationId and target branchId into query filter.
 * Prevents accidental cross-branch or cross-tenant data leakage.
 */
export const withBranch = <T extends Record<string, any>>(
  req: AuthorizedRequest,
  branchId: string | ObjectId,
  filter: T = {} as T
): T & { organizationId: ObjectId; branchId: ObjectId } => {
  const tenantFilter = withTenant(req, filter);
  const parsedBranchId = typeof branchId === 'string' ? new ObjectId(branchId) : branchId;

  return {
    ...tenantFilter,
    branchId: parsedBranchId
  };
};
