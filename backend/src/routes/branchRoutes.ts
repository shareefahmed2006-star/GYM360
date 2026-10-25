import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { requireBranchAccess } from '../middleware/branchMiddleware';
import {
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  updateBranchStatus,
  deleteBranch,
} from '../controllers/branchController';

const router = Router();

// List branches for tenant (Admin and Member)
router.get('/', authenticate, requireTenant, listBranches);

// Create new branch under tenant (Admin only)
router.post('/', authenticate, requireTenant, requireRole('admin'), createBranch);

// Get branch by ID (Admin or assigned Member enforced via requireBranchAccess)
router.get('/:branchId', authenticate, requireTenant, requireBranchAccess, getBranch);

// Update branch details (Admin only)
router.put('/:branchId', authenticate, requireTenant, requireRole('admin'), updateBranch);

// Update branch status (Admin only - soft active/inactive change)
router.patch('/:branchId/status', authenticate, requireTenant, requireRole('admin'), updateBranchStatus);

// Delete branch permanently from database (Admin only)
router.delete('/:branchId', authenticate, requireTenant, requireRole('admin'), deleteBranch);

export default router;
