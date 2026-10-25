import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  MemberDocument,
  CreateMemberDTO,
  AdminUpdateMemberDTO,
  MemberUpdateSelfDTO
} from '../types/member';

export const listMembers = async (
  tenantId?: ObjectId,
  filterBranchId?: ObjectId
): Promise<MemberDocument[]> => {
  const db = dbConnection.getDb();
  const query: any = {};
  if (tenantId) {
    query.organizationId = tenantId;
  }
  if (filterBranchId) {
    query.branchId = filterBranchId;
  }
  return db.collection<MemberDocument>('members').find(query).toArray();
};

export const getMemberById = async (
  tenantId: ObjectId | undefined,
  memberId: ObjectId
): Promise<MemberDocument> => {
  const db = dbConnection.getDb();
  const query: any = { _id: memberId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const member = await db.collection<MemberDocument>('members').findOne(query);

  if (!member) {
    throw new AppError('Member profile not found.', 404);
  }

  return member;
};

export const createMember = async (
  tenantId: ObjectId,
  data: CreateMemberDTO
): Promise<MemberDocument> => {
  const db = dbConnection.getDb();

  if (!data.firstName || typeof data.firstName !== 'string' || !data.firstName.trim()) {
    throw new AppError('Member first name is required.', 400);
  }
  if (!data.lastName || typeof data.lastName !== 'string' || !data.lastName.trim()) {
    throw new AppError('Member last name is required.', 400);
  }
  if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
    throw new AppError('Member email is required.', 400);
  }
  if (!data.branchId || !ObjectId.isValid(data.branchId)) {
    throw new AppError('A valid home branchId is required.', 400);
  }

  const branchObjectId = new ObjectId(data.branchId);
  const branch = await db.collection('branches').findOne({
    _id: branchObjectId,
    organizationId: tenantId,
    status: 'active'
  });

  if (!branch) {
    throw new AppError('Assigned home branch not found or does not belong to your organization.', 404);
  }

  const normalizedEmail = data.email.trim().toLowerCase();

  // Check duplicate member email within tenant
  const existingMember = await db.collection<MemberDocument>('members').findOne({
    organizationId: tenantId,
    email: normalizedEmail
  });
  if (existingMember) {
    throw new AppError('A member with this email address already exists in your organization.', 409);
  }

  const newMemberDoc: Omit<MemberDocument, '_id'> & { _id?: ObjectId } = {
    organizationId: tenantId,
    branchId: branchObjectId,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: normalizedEmail,
    phone: data.phone?.trim(),
    dateOfBirth: data.dateOfBirth?.trim(),
    gender: data.gender?.trim(),
    emergencyContact: data.emergencyContact ? {
      name: data.emergencyContact.name.trim(),
      phone: data.emergencyContact.phone.trim()
    } : undefined,
    status: 'active'
  };

  // Clean undefined fields so MongoDB validator receives clean payload
  Object.keys(newMemberDoc).forEach(key => {
    if ((newMemberDoc as any)[key] === undefined) {
      delete (newMemberDoc as any)[key];
    }
  });

  const result = await db.collection<MemberDocument>('members').insertOne(newMemberDoc as MemberDocument);

  const createdMember = await db.collection<MemberDocument>('members').findOne({
    _id: result.insertedId,
    organizationId: tenantId
  });

  return createdMember!;
};

export const updateMemberAsAdmin = async (
  tenantId: ObjectId,
  memberId: ObjectId,
  data: AdminUpdateMemberDTO
): Promise<MemberDocument> => {
  const db = dbConnection.getDb();
  const currentMember = await db.collection<MemberDocument>('members').findOne({
    _id: memberId,
    organizationId: tenantId
  });

  if (!currentMember) {
    throw new AppError('Member not found.', 404);
  }

  const updateFields: any = {};

  if (data.firstName !== undefined) updateFields.firstName = data.firstName.trim();
  if (data.lastName !== undefined) updateFields.lastName = data.lastName.trim();
  if (data.phone !== undefined) updateFields.phone = data.phone.trim();
  if (data.dateOfBirth !== undefined) updateFields.dateOfBirth = data.dateOfBirth.trim();
  if (data.gender !== undefined) updateFields.gender = data.gender.trim();
  if (data.status !== undefined) {
    if (data.status !== 'active' && data.status !== 'inactive') {
      throw new AppError('Status must be either active or inactive.', 400);
    }
    updateFields.status = data.status;
  }
  if (data.emergencyContact !== undefined) {
    updateFields.emergencyContact = {
      name: data.emergencyContact.name.trim(),
      phone: data.emergencyContact.phone.trim()
    };
  }

  // Admin branch reassignment
  if (data.branchId !== undefined) {
    if (!ObjectId.isValid(data.branchId)) {
      throw new AppError('Invalid branch identifier format.', 400);
    }
    const newBranchId = new ObjectId(data.branchId);
    const branch = await db.collection('branches').findOne({
      _id: newBranchId,
      organizationId: tenantId,
      status: 'active'
    });
    if (!branch) {
      throw new AppError('Target branch does not exist or does not belong to your organization.', 404);
    }
    updateFields.branchId = newBranchId;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No valid fields provided for update.', 400);
  }

  await db.collection<MemberDocument>('members').updateOne(
    { _id: memberId, organizationId: tenantId },
    { $set: updateFields }
  );

  return (await db.collection<MemberDocument>('members').findOne({ _id: memberId, organizationId: tenantId }))!;
};

export const updateMemberSelf = async (
  tenantId: ObjectId,
  memberId: ObjectId,
  data: MemberUpdateSelfDTO
): Promise<MemberDocument> => {
  const db = dbConnection.getDb();

  // Strictly reject forbidden fields with 403 Forbidden
  const rawData = data as any;
  if (
    rawData.branchId !== undefined ||
    rawData.status !== undefined ||
    rawData.organizationId !== undefined ||
    rawData._id !== undefined
  ) {
    throw new AppError(
      'Access denied: Members are strictly forbidden from modifying branchId, status, or organizationId.',
      403
    );
  }

  const currentMember = await db.collection<MemberDocument>('members').findOne({
    _id: memberId,
    organizationId: tenantId
  });

  if (!currentMember) {
    throw new AppError('Member profile not found.', 404);
  }

  const updateFields: any = {};
  if (data.phone !== undefined) updateFields.phone = data.phone.trim();
  if (data.emergencyContact !== undefined) {
    updateFields.emergencyContact = {
      name: data.emergencyContact.name.trim(),
      phone: data.emergencyContact.phone.trim()
    };
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No permitted personal fields provided for update.', 400);
  }

  await db.collection<MemberDocument>('members').updateOne(
    { _id: memberId, organizationId: tenantId },
    { $set: updateFields }
  );

  return (await db.collection<MemberDocument>('members').findOne({ _id: memberId, organizationId: tenantId }))!;
};

export const deleteMember = async (
  tenantId: ObjectId | undefined,
  memberId: ObjectId
): Promise<boolean> => {
  const db = dbConnection.getDb();
  const query: any = { _id: memberId };
  if (tenantId) {
    query.organizationId = tenantId;
  }
  const result = await db.collection<MemberDocument>('members').deleteOne(query);
  if (result.deletedCount === 0) {
    throw new AppError('Member profile not found or already deleted.', 404);
  }
  await db.collection('Users').deleteOne({ memberId });
  return true;
};
