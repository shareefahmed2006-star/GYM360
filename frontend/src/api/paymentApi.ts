import { apiClient } from './apiClient';
import {
  PaymentDocument,
  CreatePaymentDTO,
  PaymentFilterParams,
  PaymentStatus,
} from '../types/payment.types';

export const paymentApi = {
  /**
   * List all payments in tenant with optional backend filters.
   */
  listPayments: async (
    filters?: PaymentFilterParams
  ): Promise<PaymentDocument[]> => {
    const params: Record<string, string | undefined> = {};
    if (filters?.branchId) params.branchId = filters.branchId;
    if (filters?.memberId) params.memberId = filters.memberId;
    if (filters?.status) params.status = filters.status;
    if (filters?.paymentMethod) params.paymentMethod = filters.paymentMethod;

    const response = await apiClient<{ payments: PaymentDocument[] }>(
      '/payments',
      {
        method: 'GET',
        params,
      }
    );
    return response.data?.payments || [];
  },

  /**
   * Get single payment by ID.
   */
  getPayment: async (paymentId: string): Promise<PaymentDocument> => {
    const response = await apiClient<{ payment: PaymentDocument }>(
      `/payments/${paymentId}`,
      {
        method: 'GET',
      }
    );
    if (!response.data?.payment) {
      throw new Error('Payment record was not returned by the server.');
    }
    return response.data.payment;
  },

  /**
   * Record a new payment.
   */
  createPayment: async (dto: CreatePaymentDTO): Promise<PaymentDocument> => {
    const response = await apiClient<{ payment: PaymentDocument }>(
      '/payments',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    if (!response.data?.payment) {
      throw new Error('Failed to record payment.');
    }
    return response.data.payment;
  },

  /**
   * Update payment status (e.g. mark completed, failed, or refunded).
   */
  updatePaymentStatus: async (
    paymentId: string,
    status: PaymentStatus
  ): Promise<PaymentDocument> => {
    const response = await apiClient<{ payment: PaymentDocument }>(
      `/payments/${paymentId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    if (!response.data?.payment) {
      throw new Error('Failed to update payment status.');
    }
    return response.data.payment;
  },

  /**
   * Permanently delete a payment from the database.
   */
  deletePayment: async (paymentId: string): Promise<boolean> => {
    await apiClient(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
