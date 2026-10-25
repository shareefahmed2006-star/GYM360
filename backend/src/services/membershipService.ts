import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { MembershipDocument, CreateMembershipDTO } from '../types/membership';
import { getTodayUtcDateString, calculateEndDateUtc } from '../utils/dateUtils';

export const listMemberships = async (
  tenantId?: ObjectId,
  filterMemberId?: ObjectId
): Promise<MembershipDocument[]> => {
  const db = dbConnection.getDb();
  const query: any = tenantId ? { organizationId: tenantId } : {};
  if (filterMemberId) {
    query.memberId = filterMemberId;
  }
  return db.collection<MembershipDocument>('memberships').find(query).toArray();
};

export const getMembershipById = async (
  tenantId: ObjectId | undefined,
  membershipId: ObjectId
): Promise<MembershipDocument> => {
  const db = dbConnection.getDb();
  const query: any = { _id: membershipId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const membership = await db.collection<MembershipDocument>('memberships').findOne(query);

  if (!membership) {
    throw new AppError('Membership subscription not found.', 404);
  }

  return membership;
};

export const createMembership = async (
  tenantId: ObjectId,
  callerRole: string,
  callerMemberId: string | undefined,
  data: CreateMembershipDTO
): Promise<MembershipDocument> => {
  const db = dbConnection.getDb();

  if (!data.memberId || !ObjectId.isValid(data.memberId)) {
    throw new AppError('Valid memberId is required.', 400);
  }
  if (!data.planId || !ObjectId.isValid(data.planId)) {
    throw new AppError('Valid planId is required.', 400);
  }

  const memberObjectId = new ObjectId(data.memberId);
  const planObjectId = new ObjectId(data.planId);

  // 1. Verify Member belongs to authenticated tenant and is active
  const member = await db.collection('members').findOne({
    _id: memberObjectId,
    organizationId: tenantId,
    status: 'active'
  });
  if (!member) {
    throw new AppError('Active member not found in your organization.', 404);
  }

  // 2. Member self-enrollment vs Admin enrollment rules
  let finalBranchId: ObjectId;

  if (callerRole === 'member') {
    // Enforce member self-enrollment identity
    if (!callerMemberId || callerMemberId !== data.memberId) {
      throw new AppError('Access denied: Members may only purchase memberships for themselves.', 403);
    }

    // Branch rule for member self-enrollment:
    // If branchId is supplied and differs from home branch, REJECT with 403
    if (data.branchId) {
      if (data.branchId !== member.branchId.toHexString()) {
        throw new AppError(
          'Access denied: Members may only self-enroll into their assigned home branch.',
          403
        );
      }
    }
    finalBranchId = member.branchId as ObjectId;
  } else if (callerRole === 'admin') {
    // Admin enrollment: can select any active branch in the organization
    if (data.branchId) {
      if (!ObjectId.isValid(data.branchId)) {
        throw new AppError('Invalid branch identifier format.', 400);
      }
      const requestedBranchId = new ObjectId(data.branchId);
      const branch = await db.collection('branches').findOne({
        _id: requestedBranchId,
        organizationId: tenantId,
        status: 'active'
      });
      if (!branch) {
        throw new AppError('Target branch not found or does not belong to your organization.', 404);
      }
      finalBranchId = requestedBranchId;
    } else {
      finalBranchId = member.branchId as ObjectId;
    }
  } else {
    throw new AppError('Unauthorized role for membership enrollment.', 403);
  }

  // 3. Verify Plan belongs to authenticated tenant and is active
  const plan = await db.collection('membershipPlans').findOne({
    _id: planObjectId,
    organizationId: tenantId,
    status: 'active'
  });
  if (!plan) {
    throw new AppError('Active membership plan not found in your organization.', 404);
  }

  // 4. Pure UTC Date arithmetic (startDate and endDate)
  const startDate = data.startDate ? data.startDate.trim() : getTodayUtcDateString();
  const endDate = calculateEndDateUtc(startDate, Number(plan.durationDays));

  // 5. Construct document conforming strictly to MongoDB $jsonSchema for 'memberships'
  const newMembershipDoc: Omit<MembershipDocument, '_id'> & { _id?: ObjectId } = {
    organizationId: tenantId,
    branchId: finalBranchId,
    memberId: memberObjectId,
    planId: planObjectId,
    startDate,
    endDate,
    status: 'active',
    autoRenew: Boolean(data.autoRenew)
  };

  const result = await db.collection<MembershipDocument>('memberships').insertOne(
    newMembershipDoc as MembershipDocument
  );

  return (await db.collection<MembershipDocument>('memberships').findOne({
    _id: result.insertedId,
    organizationId: tenantId
  }))!;
};

export const cancelMembership = async (
  tenantId: ObjectId,
  membershipId: ObjectId,
  callerRole: string,
  callerMemberId?: string
): Promise<MembershipDocument> => {
  const db = dbConnection.getDb();
  const membership = await db.collection<MembershipDocument>('memberships').findOne({
    _id: membershipId,
    organizationId: tenantId
  });

  if (!membership) {
    throw new AppError('Membership subscription not found.', 404);
  }

  // If caller is member, can only cancel their own membership
  if (callerRole === 'member') {
    if (!callerMemberId || membership.memberId.toHexString() !== callerMemberId) {
      throw new AppError('Access denied: You can only cancel your own membership.', 403);
    }
  }

  const result = await db.collection<MembershipDocument>('memberships').findOneAndUpdate(
    { _id: membershipId, organizationId: tenantId },
    { $set: { status: 'cancelled' } },
    { returnDocument: 'after' }
  );

  return result!;
};

export const getExpiringMemberships = async (
  daysAhead: number = 14,
  memberId?: ObjectId
): Promise<any[]> => {
  const db = dbConnection.getDb();
  const todayUtc = getTodayUtcDateString();
  const horizonDate = calculateEndDateUtc(todayUtc, daysAhead);

  const query: any = {
    endDate: { $gte: todayUtc, $lte: horizonDate },
    status: 'active',
  };

  if (memberId) {
    query.memberId = memberId;
  }

  const expiring = await db.collection<MembershipDocument>('memberships').find(query).toArray();

  return Promise.all(
    expiring.map(async (m) => {
      const member = await db.collection('members').findOne({ _id: m.memberId });
      const plan = await db.collection('membershipPlans').findOne({ _id: m.planId });
      const branch = m.branchId ? await db.collection('branches').findOne({ _id: m.branchId }) : null;

      const endMs = new Date(m.endDate).getTime();
      const todayMs = new Date(todayUtc).getTime();
      const daysRemaining = Math.max(0, Math.ceil((endMs - todayMs) / (1000 * 60 * 60 * 24)));

      return {
        ...m,
        memberName: member ? `${member.firstName} ${member.lastName}` : 'Member',
        memberEmail: member?.email || '',
        memberPhone: member?.phone || '',
        branchName: branch?.name || 'Main Facility',
        planName: plan?.name || 'Membership Plan',
        planPrice: plan?.price || 0,
        planDurationMonths: plan?.durationMonths || 1,
        daysRemaining,
      };
    })
  );
};

export const renewMembership = async (
  tenantId: ObjectId,
  membershipId: ObjectId,
  callerRole: string,
  callerMemberId?: string,
  options?: { paymentMethod?: string }
): Promise<{ membership: MembershipDocument; payment: any }> => {
  const db = dbConnection.getDb();
  const membership = await db.collection<MembershipDocument>('memberships').findOne({
    _id: membershipId,
  });

  if (!membership) {
    throw new AppError('Membership subscription not found.', 404);
  }

  if (callerRole === 'member') {
    if (!callerMemberId || membership.memberId.toHexString() !== callerMemberId) {
      throw new AppError('Access denied: You can only renew your own membership.', 403);
    }
  }

  const plan = await db.collection('membershipPlans').findOne({ _id: membership.planId });
  const durationDays = plan ? Number(plan.durationDays || (plan.durationMonths ? plan.durationMonths * 30 : 30)) : 30;
  const price = plan ? Number(plan.price || 0) : 0;

  const todayUtc = getTodayUtcDateString();
  const newStartDate = membership.endDate && membership.endDate > todayUtc ? membership.endDate : todayUtc;
  const newEndDate = calculateEndDateUtc(newStartDate, durationDays);

  const updatedMembership = await db.collection<MembershipDocument>('memberships').findOneAndUpdate(
    { _id: membershipId },
    {
      $set: {
        startDate: newStartDate,
        endDate: newEndDate,
        status: 'active',
      },
    },
    { returnDocument: 'after' }
  );

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const txnRef = `GYM360-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const validMethods = ['cash', 'card', 'upi', 'bank_transfer'];
  const rawMethod = (options?.paymentMethod || 'upi').toLowerCase();
  const paymentMethod = validMethods.includes(rawMethod) ? rawMethod : 'upi';

  const newPaymentDoc = {
    organizationId: membership.organizationId,
    branchId: membership.branchId,
    memberId: membership.memberId,
    membershipId: membership._id,
    amount: price,
    paymentMethod,
    status: 'completed',
    paymentDate: todayUtc,
    transactionReference: txnRef,
    invoiceNumber,
  };

  const paymentInsert = await db.collection('payments').insertOne(newPaymentDoc as any);

  // Send an automated confirmation alert to the member
  await db.collection('notifications').insertOne({
    organizationId: membership.organizationId,
    title: 'Membership Successfully Renewed',
    message: `Your ${plan?.name || 'membership'} has been renewed until ${newEndDate}. Invoice Number: ${invoiceNumber}`,
    recipientType: 'member',
    recipientUserId: (await db.collection('Users').findOne({ memberId: membership.memberId }))?._id || null,
    type: 'membership_renewal',
    status: 'sent',
    createdAt: new Date(),
  });

  return {
    membership: updatedMembership!,
    payment: { _id: paymentInsert.insertedId, ...newPaymentDoc },
  };
};

export const deleteMembership = async (
  tenantId: ObjectId | undefined,
  membershipId: ObjectId
): Promise<boolean> => {
  const db = dbConnection.getDb();
  const query: any = { _id: membershipId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const result = await db.collection<MembershipDocument>('memberships').deleteOne(query);
  if (result.deletedCount === 0) {
    throw new AppError('Membership subscription not found or already deleted.', 404);
  }
  return true;
};
