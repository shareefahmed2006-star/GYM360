import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { requireBranchAccess } from '../middleware/branchMiddleware';
import {
  getAdminAccess,
  getMemberAccess,
  getBranchAccess
} from '../controllers/testAccessController';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Guard: Disable completely in production environments
router.use((req: Request, res: Response, next: NextFunction) => {
  if (config.nodeEnv === 'production') {
    return next(new AppError('Temporary test access routes are disabled in production.', 404));
  }
  next();
});

/**
 * TEMPORARY AUTHORIZATION VERIFICATION ROUTES
 * Note: These routes are for Milestone 3 verification only and are not permanent business APIs.
 */

// A. Admin-only verification route
router.get(
  '/admin-only',
  authenticate,
  requireTenant,
  requireRole('admin'),
  getAdminAccess
);

// B. Member-only verification route
router.get(
  '/member-only',
  authenticate,
  requireTenant,
  requireRole('member'),
  getMemberAccess
);

// C. Branch access verification route (evaluates Admin chain-wide vs Member assigned branch)
router.get(
  '/branch/:branchId',
  authenticate,
  requireTenant,
  requireBranchAccess,
  getBranchAccess
);

export default router;
