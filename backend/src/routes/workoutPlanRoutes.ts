import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { WorkoutPlanController } from '../controllers/workoutPlanController';

const router = Router();

// Create workout plan (Admin only)
router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  WorkoutPlanController.createPlan
);

// List workout plans (Admin sees all; Member sees active only)
router.get('/', authenticate, requireTenant, WorkoutPlanController.listPlans);

// Get workout plan details
router.get('/:planId', authenticate, requireTenant, WorkoutPlanController.getPlanById);

// Update workout plan (Admin only)
router.patch(
  '/:planId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  WorkoutPlanController.updatePlan
);

export default router;
