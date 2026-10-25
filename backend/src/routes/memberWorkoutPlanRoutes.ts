import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { MemberWorkoutPlanController } from '../controllers/memberWorkoutPlanController';

const router = Router();

// Assign workout plan to member (Admin only)
router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MemberWorkoutPlanController.assignPlan
);

// List assignments (Admin sees tenant; Member sees own only)
router.get('/', authenticate, requireTenant, MemberWorkoutPlanController.listAssignments);

// Get assignment details (Admin, or assigned Member)
router.get('/:assignmentId', authenticate, requireTenant, MemberWorkoutPlanController.getAssignmentById);

// Update assignment status (Admin: completed/inactive; Member: completed for own assignment)
router.patch(
  '/:assignmentId/status',
  authenticate,
  requireTenant,
  MemberWorkoutPlanController.updateAssignmentStatus
);

export default router;
