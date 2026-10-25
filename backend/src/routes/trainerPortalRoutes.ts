import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { TrainerPortalController } from '../controllers/trainerPortalController';

const router = Router();

// Enforce authentication, tenant scoping, and trainer role across all routes
router.use(authenticate);
router.use(requireTenant);
router.use(requireRole('trainer'));

// Trainer dashboard metrics and today's schedule
router.get('/dashboard', TrainerPortalController.getDashboard);

// Trainer sessions listing
router.get('/sessions', TrainerPortalController.listSessions);

// Update session status (e.g. mark completed, cancelled)
router.patch('/sessions/:sessionId/status', TrainerPortalController.updateSessionStatus);

// List trainer's assigned clients
router.get('/clients', TrainerPortalController.listClients);

// View trainer availability
router.get('/availability', TrainerPortalController.getAvailability);

export default router;
