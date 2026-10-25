import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
  PaymentCreationStatus,
  CreatePaymentDTO
} from '../types/payment';
import { getTodayUtcDateString } from '../utils/dateUtils';

// Valid payment methods
const ALL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'upi', 'bank_transfer'];
const MEMBER_PAYMENT_METHODS: PaymentMethod[] = ['card', 'upi'];

// State transition matrix
const VALID_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['completed', 'failed'],
  completed: ['refunded'],
  failed: [],     // Terminal
  refunded: []   // Terminal
};

export const listPayments = async (
  tenantId: ObjectId | undefined,
  callerRole: string,
  callerMemberId?: string,
  filters?: { branchId?: string; memberId?: string; status?: string; paymentMethod?: string }
): Promise<PaymentDocument[]> => {
  const db = dbConnection.getDb();
  const query: any = (callerRole === 'admin' || !tenantId) ? {} : { organizationId: tenantId };

  if (callerRole === 'member') {
    if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
      throw new AppError('User account is not linked to a member profile.', 403);
    }
    query.memberId = new ObjectId(callerMemberId);
  } else {
    // Admin filters
    if (filters?.memberId && ObjectId.isValid(filters.memberId)) {
      query.memberId = new ObjectId(filters.memberId);
    }
    if (filters?.branchId && ObjectId.isValid(filters.branchId)) {
      query.branchId = new ObjectId(filters.branchId);
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }
  }

  return db.collection<PaymentDocument>('payments').find(query).toArray();
};

export const getPaymentById = async (
  tenantId: ObjectId,
  paymentId: ObjectId,
  callerRole: string,
  callerMemberId?: string
): Promise<PaymentDocument> => {
  const db = dbConnection.getDb();
  const payment = await db.collection<PaymentDocument>('payments').findOne({
    _id: paymentId,
    organizationId: tenantId
  });

  if (!payment) {
    throw new AppError('Payment record not found.', 404);
  }

  if (callerRole === 'member') {
    if (!callerMemberId || payment.memberId.toHexString() !== callerMemberId) {
      throw new AppError('Access denied: You can only view your own payment records.', 403);
    }
  }

  return payment;
};

export const createPayment = async (
  tenantId: ObjectId,
  callerRole: string,
  callerMemberId: string | undefined,
  data: CreatePaymentDTO
): Promise<PaymentDocument> => {
  const db = dbConnection.getDb();

  // 1. Validate Amount (Strictly finite number > 0)
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount <= 0) {
    throw new AppError('Payment amount must be a finite number strictly greater than zero.', 400);
  }

  // 2. Validate Payment Method and Role Permissions
  if (!ALL_PAYMENT_METHODS.includes(data.paymentMethod)) {
    throw new AppError(
      `Invalid payment method. Allowed methods: ${ALL_PAYMENT_METHODS.join(', ')}`,
      400
    );
  }

  if (callerRole === 'member') {
    if (!MEMBER_PAYMENT_METHODS.includes(data.paymentMethod)) {
      throw new AppError('Access denied: Members may only make payments using card or upi.', 403);
    }
    if (!callerMemberId || callerMemberId !== data.memberId) {
      throw new AppError('Access denied: Members may only record payments for themselves.', 403);
    }
  }

  // 3. Validate Creation Status (Reject 'refunded' on creation)
  if ((data.status as any) === 'refunded') {
    throw new AppError(
      'A payment cannot be created with refunded status; refunds must be processed through the status update endpoint.',
      400
    );
  }
  const initialStatus: PaymentCreationStatus = data.status || 'completed';

  // 4. Validate Member & Membership existence in tenant
  if (!data.memberId || !ObjectId.isValid(data.memberId)) {
    throw new AppError('Valid memberId is required.', 400);
  }
  if (!data.membershipId || !ObjectId.isValid(data.membershipId)) {
    throw new AppError('Valid membershipId is required.', 400);
  }

  const memberObjectId = new ObjectId(data.memberId);
  const membershipObjectId = new ObjectId(data.membershipId);

  const member = await db.collection('members').findOne({
    _id: memberObjectId,
    organizationId: tenantId,
    status: 'active'
  });
  if (!member) {
    throw new AppError('Active member not found in your organization.', 404);
  }

  const membership = await db.collection('memberships').findOne({
    _id: membershipObjectId,
    organizationId: tenantId
  });
  if (!membership) {
    throw new AppError('Membership not found in your organization.', 404);
  }

  // Verify membership belongs to this member
  if (!membership.memberId.equals(memberObjectId)) {
    throw new AppError('Membership does not belong to the specified member.', 400);
  }

  // 5. Payment branchId must match linked membership.branchId
  if (data.branchId) {
    if (!ObjectId.isValid(data.branchId) || data.branchId !== membership.branchId.toHexString()) {
      throw new AppError('Payment branchId must match the linked membership branchId.', 400);
    }
  }
  const branchObjectId = membership.branchId as ObjectId;

  // 6. Handle Transaction Reference & Application-Level Tenant Deduplication
  let ref: string;
  if (data.transactionReference && typeof data.transactionReference === 'string' && data.transactionReference.trim()) {
    ref = data.transactionReference.trim();
  } else {
    ref = `GYM360-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const existingTxn = await db.collection('payments').findOne({
    organizationId: tenantId,
    transactionReference: ref
  });
  if (existingTxn) {
    throw new AppError(
      `A payment with transaction reference "${ref}" already exists in your organization.`,
      409
    );
  }

  // 7. Payment Date (Defaults to UTC calendar date)
  const paymentDate = data.paymentDate && typeof data.paymentDate === 'string' && data.paymentDate.trim()
    ? data.paymentDate.trim()
    : getTodayUtcDateString();

  // 8. Construct Payment Document
  const newPaymentDoc: Omit<PaymentDocument, '_id'> & { _id?: ObjectId } = {
    organizationId: tenantId,
    branchId: branchObjectId,
    memberId: memberObjectId,
    membershipId: membershipObjectId,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    paymentDate,
    status: initialStatus,
    transactionReference: ref
  };

  const result = await db.collection<PaymentDocument>('payments').insertOne(
    newPaymentDoc as PaymentDocument
  );

  // NOTE: Linked membership document is deliberately NOT modified!

  return (await db.collection<PaymentDocument>('payments').findOne({
    _id: result.insertedId,
    organizationId: tenantId
  }))!;
};

export const updatePaymentStatus = async (
  tenantId: ObjectId,
  paymentId: ObjectId,
  newStatus: PaymentStatus
): Promise<PaymentDocument> => {
  const db = dbConnection.getDb();

  const currentPayment = await db.collection<PaymentDocument>('payments').findOne({
    _id: paymentId,
    organizationId: tenantId
  });

  if (!currentPayment) {
    throw new AppError('Payment record not found.', 404);
  }

  const currentStatus = currentPayment.status;
  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    throw new AppError(
      `Invalid payment status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${
        allowedNext.length > 0 ? allowedNext.join(', ') : 'none (terminal state)'
      }.`,
      400
    );
  }

  const result = await db.collection<PaymentDocument>('payments').findOneAndUpdate(
    { _id: paymentId, organizationId: tenantId },
    { $set: { status: newStatus } },
    { returnDocument: 'after' }
  );

  return result!;
};

export const deletePayment = async (
  tenantId: ObjectId | undefined,
  paymentId: ObjectId
): Promise<boolean> => {
  const db = dbConnection.getDb();
  const query: any = { _id: paymentId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const result = await db.collection<PaymentDocument>('payments').deleteOne(query);
  if (result.deletedCount === 0) {
    throw new AppError('Payment record not found or already deleted.', 404);
  }
  return true;
};
