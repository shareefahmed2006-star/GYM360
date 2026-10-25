import { ObjectId, Int32 } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  MembershipPlanDocument,
  CreateMembershipPlanDTO,
  UpdateMembershipPlanDTO
} from '../types/membershipPlan';

export const validateDurationDays = (days: unknown): Int32 => {
  if (typeof days !== 'number' || !Number.isFinite(days)) {
    throw new AppError('Plan durationDays must be a valid number.', 400);
  }
  if (!Number.isInteger(days)) {
    throw new AppError('Plan durationDays must be an integer (fractional days not allowed).', 400);
  }
  if (days <= 0) {
    throw new AppError('Plan durationDays must be greater than zero.', 400);
  }
  if (days > 2147483647) {
    throw new AppError('Plan durationDays exceeds maximum 32-bit integer range.', 400);
  }
  return new Int32(days);
};

export const listPlans = async (
  tenantId?: ObjectId,
  onlyActive: boolean = false
): Promise<MembershipPlanDocument[]> => {
  const db = dbConnection.getDb();
  const query: any = tenantId ? { organizationId: tenantId } : {};
  if (onlyActive) {
    query.status = 'active';
  }
  return db.collection<MembershipPlanDocument>('membershipPlans').find(query).toArray();
};

export const getPlanById = async (
  tenantId: ObjectId | undefined,
  planId: ObjectId
): Promise<MembershipPlanDocument> => {
  const db = dbConnection.getDb();
  const query: any = { _id: planId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const plan = await db.collection<MembershipPlanDocument>('membershipPlans').findOne(query);

  if (!plan) {
    throw new AppError('Membership plan not found.', 404);
  }

  return plan;
};

export const createPlan = async (
  tenantId: ObjectId,
  data: CreateMembershipPlanDTO
): Promise<MembershipPlanDocument> => {
  const db = dbConnection.getDb();

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    throw new AppError('Plan name is required.', 400);
  }
  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    throw new AppError('Plan description is required.', 400);
  }
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0) {
    throw new AppError('Plan price must be a non-negative number.', 400);
  }
  if (data.branchAccess !== 'single_branch' && data.branchAccess !== 'all_branches') {
    throw new AppError('Plan branchAccess must be either single_branch or all_branches.', 400);
  }

  const durationInt32 = validateDurationDays(data.durationDays);

  const newPlanDoc: Omit<MembershipPlanDocument, '_id'> & { _id?: ObjectId } = {
    organizationId: tenantId,
    name: data.name.trim(),
    description: data.description.trim(),
    durationDays: durationInt32,
    price: data.price,
    branchAccess: data.branchAccess,
    status: 'active'
  };

  const result = await db.collection<MembershipPlanDocument>('membershipPlans').insertOne(
    newPlanDoc as MembershipPlanDocument
  );

  return (await db.collection<MembershipPlanDocument>('membershipPlans').findOne({
    _id: result.insertedId,
    organizationId: tenantId
  }))!;
};

export const updatePlan = async (
  tenantId: ObjectId,
  planId: ObjectId,
  data: UpdateMembershipPlanDTO
): Promise<MembershipPlanDocument> => {
  const db = dbConnection.getDb();

  const currentPlan = await db.collection<MembershipPlanDocument>('membershipPlans').findOne({
    _id: planId,
    organizationId: tenantId
  });

  if (!currentPlan) {
    throw new AppError('Membership plan not found.', 404);
  }

  // Check if this plan is already referenced by existing memberships
  const membershipRefCount = await db.collection('memberships').countDocuments({
    planId: planId,
    organizationId: tenantId
  });

  if (membershipRefCount > 0) {
    // If referenced, durationDays, price, and branchAccess must NOT be changed
    const changesDuration = data.durationDays !== undefined && Number(data.durationDays) !== Number(currentPlan.durationDays);
    const changesPrice = data.price !== undefined && data.price !== currentPlan.price;
    const changesBranchAccess = data.branchAccess !== undefined && data.branchAccess !== currentPlan.branchAccess;

    if (changesDuration || changesPrice || changesBranchAccess) {
      throw new AppError(
        'Plan terms (durationDays, price, branchAccess) cannot be modified because this plan is referenced by existing memberships. To change these terms, please create a new membership plan.',
        409
      );
    }
  }

  const updateFields: any = {};

  if (data.name !== undefined) {
    if (!data.name.trim()) throw new AppError('Plan name cannot be empty.', 400);
    updateFields.name = data.name.trim();
  }
  if (data.description !== undefined) {
    if (!data.description.trim()) throw new AppError('Plan description cannot be empty.', 400);
    updateFields.description = data.description.trim();
  }
  if (data.price !== undefined && membershipRefCount === 0) {
    if (typeof data.price !== 'number' || data.price < 0) throw new AppError('Valid non-negative price required.', 400);
    updateFields.price = data.price;
  }
  if (data.durationDays !== undefined && membershipRefCount === 0) {
    updateFields.durationDays = validateDurationDays(data.durationDays);
  }
  if (data.branchAccess !== undefined && membershipRefCount === 0) {
    if (data.branchAccess !== 'single_branch' && data.branchAccess !== 'all_branches') {
      throw new AppError('Invalid branchAccess tier.', 400);
    }
    updateFields.branchAccess = data.branchAccess;
  }
  if (data.status !== undefined) {
    if (data.status !== 'active' && data.status !== 'inactive') {
      throw new AppError('Status must be active or inactive.', 400);
    }
    updateFields.status = data.status;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No valid fields provided for update.', 400);
  }

  await db.collection<MembershipPlanDocument>('membershipPlans').updateOne(
    { _id: planId, organizationId: tenantId },
    { $set: updateFields }
  );

  return (await db.collection<MembershipPlanDocument>('membershipPlans').findOne({
    _id: planId,
    organizationId: tenantId
  }))!;
};

export const updatePlanStatus = async (
  tenantId: ObjectId,
  planId: ObjectId,
  status: 'active' | 'inactive'
): Promise<MembershipPlanDocument> => {
  if (status !== 'active' && status !== 'inactive') {
    throw new AppError('Status must be either active or inactive.', 400);
  }
  const db = dbConnection.getDb();
  const result = await db.collection<MembershipPlanDocument>('membershipPlans').findOneAndUpdate(
    { _id: planId, organizationId: tenantId },
    { $set: { status } },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new AppError('Membership plan not found.', 404);
  }

  return result;
};

export const deletePlan = async (
  tenantId: ObjectId | undefined,
  planId: ObjectId
): Promise<boolean> => {
  const db = dbConnection.getDb();
  const query: any = { _id: planId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const result = await db.collection<MembershipPlanDocument>('membershipPlans').deleteOne(query);
  if (result.deletedCount === 0) {
    throw new AppError('Membership plan not found or already deleted.', 404);
  }
  return true;
};
