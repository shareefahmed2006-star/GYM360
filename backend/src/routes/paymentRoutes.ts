import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import {
  listPayments,
  getPayment,
  createPayment,
  updatePaymentStatus,
  deletePayment,
} from '../controllers/paymentController';

const router = Router();

// List payments (Admin sees tenant payments; Member sees own)
router.get('/', authenticate, requireTenant, listPayments);

// Record payment (Admin for all; Member for self using card/upi)
router.post('/', authenticate, requireTenant, createPayment);

// Get single payment details
router.get('/:paymentId', authenticate, requireTenant, getPayment);

// Update payment status / process refund (Admin only)
router.patch('/:paymentId/status', authenticate, requireTenant, requireRole('admin'), updatePaymentStatus);

// Delete payment permanently from database (Admin only)
router.delete('/:paymentId', authenticate, requireTenant, requireRole('admin'), deletePayment);

export default router;
