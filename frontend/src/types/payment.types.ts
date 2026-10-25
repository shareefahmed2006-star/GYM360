export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type PaymentCreationStatus = 'completed' | 'pending' | 'failed';

export interface PaymentDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  status: PaymentStatus;
  transactionReference: string;
}

export interface CreatePaymentDTO {
  memberId: string;
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  branchId?: string;
  paymentDate?: string; // YYYY-MM-DD
  status?: PaymentCreationStatus;
  transactionReference?: string;
}

export interface UpdatePaymentStatusDTO {
  status: PaymentStatus;
}

export interface PaymentFilterParams {
  branchId?: string;
  memberId?: string;
  status?: string;
  paymentMethod?: string;
}
