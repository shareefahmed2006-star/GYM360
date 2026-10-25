import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  updatePlanStatus,
  deletePlan,
} from '../controllers/membershipPlanController';

const router = Router();

// List plans (Admin sees all; Member sees active)
router.get('/', authenticate, requireTenant, listPlans);

// Create membership plan (Admin only)
router.post('/', authenticate, requireTenant, requireRole('admin'), createPlan);

// Get plan details
router.get('/:planId', authenticate, requireTenant, getPlan);

// Update plan details (Admin only - guarded by 409 Conflict if referenced)
router.put('/:planId', authenticate, requireTenant, requireRole('admin'), updatePlan);

// Toggle plan status (Admin only)
router.patch('/:planId/status', authenticate, requireTenant, requireRole('admin'), updatePlanStatus);

// Delete plan permanently from database (Admin only)
router.delete('/:planId', authenticate, requireTenant, requireRole('admin'), deletePlan);

export default router;
