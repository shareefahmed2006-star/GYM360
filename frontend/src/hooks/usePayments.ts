import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import {
  CreatePaymentDTO,
  PaymentFilterParams,
  PaymentStatus,
} from '../types/payment.types';

export const usePayments = (filters?: PaymentFilterParams) => {
  return useQuery({
    queryKey: ['payments', filters ?? {}],
    queryFn: () => paymentApi.listPayments(filters),
  });
};

export const usePayment = (paymentId: string | undefined) => {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => {
      if (!paymentId) throw new Error('Payment ID is required');
      return paymentApi.getPayment(paymentId);
    },
    enabled: !!paymentId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePaymentDTO) => paymentApi.createPayment(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (variables.memberId) {
        queryClient.invalidateQueries({ queryKey: ['payments', { memberId: variables.memberId }] });
      }
      // Also invalidate dashboard/analytics if present
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      status,
    }: {
      paymentId: string;
      status: PaymentStatus;
    }) => paymentApi.updatePaymentStatus(paymentId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', variables.paymentId] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => paymentApi.deletePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
