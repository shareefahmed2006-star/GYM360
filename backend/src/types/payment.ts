import { ObjectId } from 'mongodb';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type PaymentCreationStatus = 'completed' | 'pending' | 'failed';

export interface PaymentDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  memberId: ObjectId;
  membershipId: ObjectId;
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
  paymentDate?: string;
  status?: PaymentCreationStatus;
  transactionReference?: string;
}

export interface UpdatePaymentStatusDTO {
  status: PaymentStatus;
}
