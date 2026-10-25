import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import { AppError } from './errorHandler';

/**
 * Multi-tenant isolation middleware.
 * Guarantees that every request is strictly bound to req.user.organizationId.
 * Rejects any attempt to spoof or override organizationId from client query, body, or params.
 */
export const requireTenant = (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.organizationId) {
    return next(new AppError('Authentication and tenant context required.', 401));
  }

  const userOrgIdStr = req.user.organizationId;

  if (!ObjectId.isValid(userOrgIdStr)) {
    return next(new AppError('Invalid tenant identifier in authenticated session.', 400));
  }

  // For non-admin roles (member, trainer), strictly prevent cross-tenant override
  const clientOrgId = (req.headers['x-organization-id'] as string) || req.body?.organizationId || req.query?.organizationId || req.params?.organizationId;
  
  if (req.user.role !== 'admin') {
    if (clientOrgId && clientOrgId !== userOrgIdStr) {
      return next(
        new AppError(
          'Cross-tenant violation: Client-supplied organizationId does not match authenticated tenant.',
          403
        )
      );
    }
    req.tenantId = new ObjectId(userOrgIdStr);
    return next();
  }

  // Attach verified tenant ObjectId
  req.tenantId = new ObjectId(userOrgIdStr);
  next();
};
