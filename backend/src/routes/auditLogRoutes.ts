import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { AuditLogController } from '../controllers/auditLogController';

const router = Router();

// List audit logs with pagination & filters (Admin only)
router.get(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AuditLogController.listAuditLogs
);

export default router;
