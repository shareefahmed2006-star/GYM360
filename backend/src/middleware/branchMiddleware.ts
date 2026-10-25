import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AuthorizedRequest, BranchSummary, MemberSummary } from '../types/authorization';
import { AppError } from './errorHandler';

/**
 * Branch-level authorization middleware.
 * - Admin: May access any branch belonging to their organization.
 * - Member: May access only the specific branch linked via:
 *           Users._id -> Users.memberId -> members._id -> members.branchId
 *           Rejects access if member attempts to access another branch even within the same organization.
 */
export const requireBranchAccess = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.organizationId) {
      return next(new AppError('Authentication and tenant context required.', 401));
    }

    const branchIdStr = req.params.branchId || req.query.branchId || req.body.branchId;

    if (!branchIdStr) {
      return next(new AppError('Branch identifier is required.', 400));
    }

    if (typeof branchIdStr !== 'string' || !ObjectId.isValid(branchIdStr)) {
      return next(new AppError('Invalid branch identifier format.', 400));
    }

    const targetBranchId = new ObjectId(branchIdStr);
    const tenantOrgId = req.tenantId || new ObjectId(req.user.organizationId);
    const db = dbConnection.getDb();

    // 1. Role === 'admin': Can access any branch belonging to their organization
    if (req.user.role === 'admin') {
      const branch = await db.collection<BranchSummary>('branches').findOne({
        _id: targetBranchId,
        organizationId: tenantOrgId
      });

      if (!branch) {
        return next(
          new AppError('Branch not found or does not belong to your organization.', 404)
        );
      }

      req.branchId = targetBranchId;
      req.branch = branch;
      return next();
    }

    // 2. Role === 'member': Strictly restricted to assigned branch
    if (req.user.role === 'member') {
      const user = await db.collection('Users').findOne({
        _id: new ObjectId(req.user.userId),
        organizationId: tenantOrgId
      });

      if (!user || !user.memberId) {
        return next(
          new AppError('Access denied: User account is not linked to a member profile.', 403)
        );
      }

      const member = await db.collection<MemberSummary>('members').findOne({
        _id: user.memberId as ObjectId,
        organizationId: tenantOrgId
      });

      if (!member || member.status !== 'active') {
        return next(
          new AppError('Access denied: Active member record not found.', 403)
        );
      }

      // Verify the member's assigned branch matches the requested branch
      if (member.branchId.toHexString() !== branchIdStr) {
        return next(
          new AppError(
            'Access denied: You are only authorized to access your assigned branch.',
            403
          )
        );
      }

      // Confirm branch exists and belongs to the tenant
      const branch = await db.collection<BranchSummary>('branches').findOne({
        _id: targetBranchId,
        organizationId: tenantOrgId
      });

      if (!branch) {
        return next(
          new AppError('Branch not found or does not belong to your organization.', 404)
        );
      }

      req.branchId = targetBranchId;
      req.branch = branch;
      req.member = member;
      return next();
    }

    // Default catch for unsupported roles
    return next(new AppError('Access denied: Role not authorized for branch access.', 403));
  } catch (error) {
    next(error);
  }
};
