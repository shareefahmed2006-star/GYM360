import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import {
  listMemberships,
  getMembership,
  createMembership,
  cancelMembership,
  getExpiringMemberships,
  renewMembership,
  deleteMembership,
} from '../controllers/membershipController';

const router = Router();

// List memberships (Admin sees all subscriptions; Member sees own)
router.get('/', authenticate, requireTenant, listMemberships);

// Expiring memberships alerts
router.get('/expiring-soon', authenticate, requireTenant, getExpiringMemberships);

// Create / enroll into membership (Admin for any member; Member for self)
router.post('/', authenticate, requireTenant, createMembership);

// 1-Click Renewal
router.post('/:membershipId/renew', authenticate, requireTenant, renewMembership);

// Get specific membership
router.get('/:membershipId', authenticate, requireTenant, getMembership);

// Cancel membership (Admin or self member)
router.patch('/:membershipId/cancel', authenticate, requireTenant, cancelMembership);

// Delete membership permanently from database (Admin only)
router.delete('/:membershipId', authenticate, requireTenant, deleteMembership);

export default router;
