import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { MaintenanceLogController } from '../controllers/maintenanceLogController';

const router = Router();

// Create maintenance log (Admin only)
router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MaintenanceLogController.createMaintenanceLog
);

// List maintenance logs with pagination & filters (Admin only)
router.get(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MaintenanceLogController.listMaintenanceLogs
);

// Get maintenance log by ID (Admin only)
router.get(
  '/:maintenanceLogId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MaintenanceLogController.getMaintenanceLogById
);

// Update maintenance log details (Admin only)
router.put(
  '/:maintenanceLogId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MaintenanceLogController.updateMaintenanceLog
);

// Update maintenance log status (Admin only)
router.patch(
  '/:maintenanceLogId/status',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MaintenanceLogController.updateMaintenanceLogStatus
);

// Delete maintenance log permanently from database (Admin only)
router.delete(
  '/:maintenanceLogId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  MaintenanceLogController.deleteMaintenanceLog
);

export default router;
