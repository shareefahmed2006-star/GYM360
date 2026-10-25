import { ObjectId } from 'mongodb';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface MemberDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  branchId: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: EmergencyContact;
  status: 'active' | 'inactive';
}

export interface CreateMemberDTO {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: EmergencyContact;
}

export interface AdminUpdateMemberDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  branchId?: string; // Admin-only branch reassignment
  emergencyContact?: EmergencyContact;
  status?: 'active' | 'inactive';
}

export interface MemberUpdateSelfDTO {
  phone?: string;
  emergencyContact?: EmergencyContact;
}
