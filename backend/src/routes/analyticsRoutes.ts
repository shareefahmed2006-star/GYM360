import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { AnalyticsController } from '../controllers/analyticsController';

const router = Router();

// 1. Executive Dashboard KPI Overview (Admin only)
router.get(
  '/dashboard',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AnalyticsController.getDashboard
);

// 2. Revenue Trends & Financial Breakdown (Admin only)
router.get(
  '/revenue',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AnalyticsController.getRevenue
);

// 3. Attendance & Facility Flow Utilization (Admin only)
router.get(
  '/attendance',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AnalyticsController.getAttendance
);

// 4. Membership Retention & Expiration Pipeline (Admin only)
router.get(
  '/membership-retention',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AnalyticsController.getMembershipRetention
);

export default router;
