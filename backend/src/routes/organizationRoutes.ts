import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { getOrganization, updateOrganization } from '../controllers/organizationController';

const router = Router();

// Retrieve organization profile (Authenticated tenant users: admin and member)
router.get('/', authenticate, requireTenant, getOrganization);

// Update organization profile (Admin only)
router.put('/', authenticate, requireTenant, requireRole('admin'), updateOrganization);

export default router;
