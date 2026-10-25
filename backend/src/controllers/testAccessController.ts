import { Response, NextFunction } from 'express';
import { AuthorizedRequest } from '../types/authorization';

/**
 * Controller for temporary authorization verification endpoints.
 * Completely READ-ONLY. Does not mutate database records.
 */

export const getAdminAccess = (
  req: AuthorizedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  res.status(200).json({
    success: true,
    message: 'Admin authorization verified successfully.',
    data: {
      role: req.user?.role,
      organizationId: req.tenantId?.toHexString(),
      userId: req.user?.userId
    }
  });
};

export const getMemberAccess = (
  req: AuthorizedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  res.status(200).json({
    success: true,
    message: 'Member authorization verified successfully.',
    data: {
      role: req.user?.role,
      organizationId: req.tenantId?.toHexString(),
      userId: req.user?.userId
    }
  });
};

export const getBranchAccess = (
  req: AuthorizedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  res.status(200).json({
    success: true,
    message: 'Branch authorization verified successfully.',
    data: {
      role: req.user?.role,
      organizationId: req.tenantId?.toHexString(),
      branchId: req.branchId?.toHexString(),
      branchName: req.branch?.name
    }
  });
};
