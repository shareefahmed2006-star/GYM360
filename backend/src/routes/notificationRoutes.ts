import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

// 1. Create notification (Admin only)
router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('admin'),
  NotificationController.createNotification
);

// 2. List notifications with pagination & filters (Admin views all in tenant; Member views own)
router.get(
  '/',
  authenticate,
  requireTenant,
  NotificationController.listNotifications
);

// 3. Get notification by ID (Admin views in tenant; Member views own)
router.get(
  '/:notificationId',
  authenticate,
  requireTenant,
  NotificationController.getNotificationById
);

// 4. Update notification status (Admin in tenant; Member for own notification)
router.patch(
  '/:notificationId/status',
  authenticate,
  requireTenant,
  NotificationController.updateNotificationStatus
);

// 5. Delete notification permanently from database (Admin only)
router.delete(
  '/:notificationId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  NotificationController.deleteNotification
);

export default router;
