import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { OrganizationDocument, UpdateOrganizationDTO, Address } from '../types/organization';

export const getOrganization = async (tenantId: ObjectId): Promise<OrganizationDocument> => {
  const db = dbConnection.getDb();
  // Strictly query by _id: tenantId because organizations collection has no organizationId field
  const org = await db.collection<OrganizationDocument>('organizations').findOne({ _id: tenantId });

  if (!org) {
    throw new AppError('Organization not found.', 404);
  }

  return org;
};

export const updateOrganization = async (
  tenantId: ObjectId,
  data: UpdateOrganizationDTO
): Promise<OrganizationDocument> => {
  const db = dbConnection.getDb();
  const currentOrg = await db.collection<OrganizationDocument>('organizations').findOne({ _id: tenantId });

  if (!currentOrg) {
    throw new AppError('Organization not found.', 404);
  }

  const updateFields: Partial<OrganizationDocument> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw new AppError('Organization name must be a non-empty string.', 400);
    }
    updateFields.name = data.name.trim();
  }

  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || !data.email.trim()) {
      throw new AppError('Organization email must be a non-empty string.', 400);
    }
    updateFields.email = data.email.trim().toLowerCase();
  }

  if (data.phone !== undefined) {
    if (typeof data.phone !== 'string' || !data.phone.trim()) {
      throw new AppError('Organization phone must be a non-empty string.', 400);
    }
    updateFields.phone = data.phone.trim();
  }

  if (data.address !== undefined) {
    // Validate that address contains all 4 required subfields per $jsonSchema
    const mergedAddress: Address = {
      street: data.address.street || currentOrg.address.street,
      city: data.address.city || currentOrg.address.city,
      state: data.address.state || currentOrg.address.state,
      postalCode: data.address.postalCode || currentOrg.address.postalCode
    };

    if (!mergedAddress.street || !mergedAddress.city || !mergedAddress.state || !mergedAddress.postalCode) {
      throw new AppError('Complete address (street, city, state, postalCode) is required.', 400);
    }

    updateFields.address = mergedAddress;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No valid fields provided for update.', 400);
  }

  await db.collection<OrganizationDocument>('organizations').updateOne(
    { _id: tenantId },
    { $set: updateFields }
  );

  const updatedOrg = await db.collection<OrganizationDocument>('organizations').findOne({ _id: tenantId });
  return updatedOrg!;
};
