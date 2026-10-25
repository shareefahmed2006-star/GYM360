import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import {
  listMembers,
  getMember,
  createMember,
  updateMember,
  updateMemberStatus,
  deleteMember,
} from '../controllers/memberController';

const router = Router();

// List members (Admin lists tenant members; Member receives only self)
router.get('/', authenticate, requireTenant, listMembers);

// Create member profile (Admin only)
router.post('/', authenticate, requireTenant, requireRole('admin'), createMember);

// Get member profile (Admin or the member themselves)
router.get('/:memberId', authenticate, requireTenant, getMember);

// Update member profile (Admin full update; Member personal fields only)
router.put('/:memberId', authenticate, requireTenant, updateMember);

// Toggle member status (Admin only)
router.patch('/:memberId/status', authenticate, requireTenant, requireRole('admin'), updateMemberStatus);

// Delete member permanently from database (Admin only)
router.delete('/:memberId', authenticate, requireTenant, requireRole('admin'), deleteMember);

export default router;
