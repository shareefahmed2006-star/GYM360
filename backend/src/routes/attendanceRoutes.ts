import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { AttendanceController } from '../controllers/attendanceController';

const router = Router();

// Member or Admin check-in
router.post('/check-in', authenticate, requireTenant, AttendanceController.checkIn);

// Member or Admin check-out
router.post('/check-out', authenticate, requireTenant, AttendanceController.checkOut);

// Admin manual historical attendance recording (present or absent)
router.post(
  '/manual',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AttendanceController.createManual
);

// List attendance records (Admin sees tenant records; Member sees own)
router.get('/', authenticate, requireTenant, AttendanceController.getAttendance);

// Get single attendance record
router.get('/:attendanceId', authenticate, requireTenant, AttendanceController.getAttendanceById);

// Delete attendance record permanently from database (Admin only)
router.delete(
  '/:attendanceId',
  authenticate,
  requireTenant,
  requireRole('admin'),
  AttendanceController.deleteAttendance
);

export default router;
