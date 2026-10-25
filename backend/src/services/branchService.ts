import { ObjectId, Int32 } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { BranchDocument, CreateBranchDTO, UpdateBranchDTO } from '../types/branch';
import { Address } from '../types/organization';

/**
 * Validates capacity strictly per MongoDB BSON Int32 specification.
 * Rejects non-numbers, non-finite values, fractions, <= 0, and out-of-range integers.
 */
export const validateCapacity = (capacity: unknown): Int32 => {
  if (typeof capacity !== 'number' || !Number.isFinite(capacity)) {
    throw new AppError('Branch capacity must be a valid finite number.', 400);
  }

  if (!Number.isInteger(capacity)) {
    throw new AppError('Branch capacity must be an integer (fractional numbers not allowed).', 400);
  }

  if (capacity <= 0) {
    throw new AppError('Branch capacity must be greater than zero.', 400);
  }

  // Max value for 32-bit signed integer
  if (capacity > 2147483647) {
    throw new AppError('Branch capacity exceeds maximum 32-bit integer range.', 400);
  }

  return new Int32(capacity);
};

export const listBranches = async (tenantId?: ObjectId): Promise<BranchDocument[]> => {
  const db = dbConnection.getDb();
  const query: any = tenantId ? { organizationId: tenantId } : {};
  return db.collection<BranchDocument>('branches').find(query).toArray();
};

export const getBranchById = async (tenantId: ObjectId | undefined, branchId: ObjectId): Promise<BranchDocument> => {
  const db = dbConnection.getDb();
  const query: any = { _id: branchId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const branch = await db.collection<BranchDocument>('branches').findOne(query);

  if (!branch) {
    throw new AppError('Branch not found.', 404);
  }

  return branch;
};

export const createBranch = async (
  tenantId: ObjectId,
  data: CreateBranchDTO
): Promise<BranchDocument> => {
  const db = dbConnection.getDb();

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    throw new AppError('Branch name is required.', 400);
  }

  if (!data.phone || typeof data.phone !== 'string' || !data.phone.trim()) {
    throw new AppError('Branch phone is required.', 400);
  }

  if (!data.openingTime || typeof data.openingTime !== 'string' || !data.openingTime.trim()) {
    throw new AppError('Branch openingTime is required.', 400);
  }

  if (!data.closingTime || typeof data.closingTime !== 'string' || !data.closingTime.trim()) {
    throw new AppError('Branch closingTime is required.', 400);
  }

  // Validate address structure
  if (!data.address || typeof data.address !== 'object') {
    throw new AppError('Branch address object is required.', 400);
  }

  const { street, city, state, postalCode } = data.address;
  if (!street || !city || !state || !postalCode) {
    throw new AppError('Complete branch address (street, city, state, postalCode) is required.', 400);
  }

  const address: Address = {
    street: street.trim(),
    city: city.trim(),
    state: state.trim(),
    postalCode: postalCode.trim()
  };

  // Convert & validate capacity strictly to BSON Int32
  const capacityInt32 = validateCapacity(data.capacity);

  const newBranchDoc: Omit<BranchDocument, '_id'> & { _id?: ObjectId } = {
    organizationId: tenantId, // Strictly bound to authenticated tenant
    name: data.name.trim(),
    address,
    phone: data.phone.trim(),
    capacity: capacityInt32,
    openingTime: data.openingTime.trim(),
    closingTime: data.closingTime.trim(),
    status: 'active'
  };

  const insertResult = await db.collection<BranchDocument>('branches').insertOne(newBranchDoc as BranchDocument);

  const createdBranch = await db.collection<BranchDocument>('branches').findOne({
    _id: insertResult.insertedId,
    organizationId: tenantId
  });

  return createdBranch!;
};

export const updateBranch = async (
  tenantId: ObjectId,
  branchId: ObjectId,
  data: UpdateBranchDTO
): Promise<BranchDocument> => {
  const db = dbConnection.getDb();

  const currentBranch = await db.collection<BranchDocument>('branches').findOne({
    _id: branchId,
    organizationId: tenantId
  });

  if (!currentBranch) {
    throw new AppError('Branch not found or does not belong to your organization.', 404);
  }

  const updateFields: Partial<BranchDocument> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw new AppError('Branch name must be a non-empty string.', 400);
    }
    updateFields.name = data.name.trim();
  }

  if (data.phone !== undefined) {
    if (typeof data.phone !== 'string' || !data.phone.trim()) {
      throw new AppError('Branch phone must be a non-empty string.', 400);
    }
    updateFields.phone = data.phone.trim();
  }

  if (data.openingTime !== undefined) {
    if (typeof data.openingTime !== 'string' || !data.openingTime.trim()) {
      throw new AppError('Branch openingTime must be a non-empty string.', 400);
    }
    updateFields.openingTime = data.openingTime.trim();
  }

  if (data.closingTime !== undefined) {
    if (typeof data.closingTime !== 'string' || !data.closingTime.trim()) {
      throw new AppError('Branch closingTime must be a non-empty string.', 400);
    }
    updateFields.closingTime = data.closingTime.trim();
  }

  if (data.capacity !== undefined) {
    updateFields.capacity = validateCapacity(data.capacity);
  }

  if (data.address !== undefined) {
    const mergedAddress: Address = {
      street: data.address.street || currentBranch.address.street,
      city: data.address.city || currentBranch.address.city,
      state: data.address.state || currentBranch.address.state,
      postalCode: data.address.postalCode || currentBranch.address.postalCode
    };

    if (!mergedAddress.street || !mergedAddress.city || !mergedAddress.state || !mergedAddress.postalCode) {
      throw new AppError('Complete address (street, city, state, postalCode) is required.', 400);
    }

    updateFields.address = mergedAddress;
  }

  if (data.status !== undefined) {
    if (data.status !== 'active' && data.status !== 'inactive') {
      throw new AppError('Branch status must be either active or inactive.', 400);
    }
    updateFields.status = data.status;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No valid fields provided for update.', 400);
  }

  await db.collection<BranchDocument>('branches').updateOne(
    { _id: branchId, organizationId: tenantId },
    { $set: updateFields }
  );

  const updatedBranch = await db.collection<BranchDocument>('branches').findOne({
    _id: branchId,
    organizationId: tenantId
  });

  return updatedBranch!;
};

export const updateBranchStatus = async (
  tenantId: ObjectId,
  branchId: ObjectId,
  status: 'active' | 'inactive'
): Promise<BranchDocument> => {
  if (status !== 'active' && status !== 'inactive') {
    throw new AppError('Status must be either active or inactive.', 400);
  }

  const db = dbConnection.getDb();

  const result = await db.collection<BranchDocument>('branches').findOneAndUpdate(
    { _id: branchId, organizationId: tenantId },
    { $set: { status } },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new AppError('Branch not found or does not belong to your organization.', 404);
  }

  return result;
};

export const deleteBranch = async (
  tenantId: ObjectId | undefined,
  branchId: ObjectId
): Promise<boolean> => {
  const db = dbConnection.getDb();
  const query: any = { _id: branchId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const result = await db.collection<BranchDocument>('branches').deleteOne(query);
  if (result.deletedCount === 0) {
    throw new AppError('Branch not found or already deleted.', 404);
  }
  return true;
};
