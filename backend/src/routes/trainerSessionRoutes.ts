import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { TrainerSessionController } from '../controllers/trainerSessionController';

const router = Router();

// Book training session (Admin for any, Member for self)
router.post('/', authenticate, requireTenant, TrainerSessionController.bookSession);

// List sessions (Admin sees tenant, Member sees self)
router.get('/', authenticate, requireTenant, TrainerSessionController.listSessions);

// Get session details (Admin or assigned Member)
router.get('/:sessionId', authenticate, requireTenant, TrainerSessionController.getSessionById);

// Update session status (Admin can complete/cancel; Member can cancel self)
router.patch('/:sessionId/status', authenticate, requireTenant, TrainerSessionController.updateSessionStatus);

export default router;
