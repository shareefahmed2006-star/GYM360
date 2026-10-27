import { Request } from 'express';
import { ObjectId } from 'mongodb';

export type UserRole = 'admin' | 'member' | 'trainer';
export type UserStatus = 'active' | 'inactive';

export interface UserDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId?: ObjectId;
  isGlobal?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  memberId?: ObjectId;
  trainerId?: ObjectId;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export interface UserResponse {
  id: string;
  organizationId: string;
  branchId?: string;
  isGlobal?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  memberId?: string;
  trainerId?: string;
}

export interface TokenPayload {
  userId: string;
  email?: string;
  organizationId: string;
  branchId?: string;
  isGlobal?: boolean;
  role: UserRole;
  status: UserStatus;
  memberId?: string;
  trainerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
