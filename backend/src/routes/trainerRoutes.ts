import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { TrainerController } from '../controllers/trainerController';

const router = Router();

// Create trainer (Admin only)
router.post('/', authenticate, requireTenant, requireRole('admin'), TrainerController.createTrainer);

// List trainers (Admin, Member)
router.get('/', authenticate, requireTenant, TrainerController.listTrainers);

// Get trainer details (Admin, Member)
router.get('/:trainerId', authenticate, requireTenant, TrainerController.getTrainerById);

// Update trainer profile (Admin only)
router.patch('/:trainerId', authenticate, requireTenant, requireRole('admin'), TrainerController.updateTrainer);

// Delete trainer permanently from database (Admin only)
router.delete('/:trainerId', authenticate, requireTenant, requireRole('admin'), TrainerController.deleteTrainer);

// Add availability slot (Admin only)
router.post(
  '/:trainerId/availability',
  authenticate,
  requireTenant,
  requireRole('admin'),
  TrainerController.createAvailability
);

// List availability slots for a trainer (Admin, Member)
router.get('/:trainerId/availability', authenticate, requireTenant, TrainerController.listAvailability);

// Update availability slot status (Admin only) - Non-destructive (no deletion)
router.patch(
  '/:trainerId/availability/:slotId/status',
  authenticate,
  requireTenant,
  requireRole('admin'),
  TrainerController.updateAvailabilityStatus
);

export default router;
