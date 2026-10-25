import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { EquipmentController } from '../controllers/equipmentController';

const router = Router();

// Register new equipment (Admin only)
router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  EquipmentController.createEquipment
);

// List equipment with pagination & filters (Admin only)
router.get(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  EquipmentController.listEquipment
);

// Get equipment by ID (Admin only)
router.get(
  '/:equipmentId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  EquipmentController.getEquipmentById
);

// Update equipment details (Admin only)
router.put(
  '/:equipmentId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  EquipmentController.updateEquipment
);

// Update equipment status (Admin only)
router.patch(
  '/:equipmentId/status',
  authenticate,
  requireTenant,
  requireRole('admin'),
  EquipmentController.updateEquipmentStatus
);

// Delete equipment permanently from database (Admin only)
router.delete(
  '/:equipmentId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  EquipmentController.deleteEquipment
);

export default router;
