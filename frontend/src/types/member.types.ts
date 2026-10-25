export interface EmergencyContact {
  name: string;
  phone: string;
}

export type MemberStatus = 'active' | 'inactive';

export interface MemberDocument {
  _id: string;
  organizationId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: EmergencyContact;
  status: MemberStatus;
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
  branchId?: string;
  emergencyContact?: EmergencyContact;
  status?: MemberStatus;
}

export interface MemberUpdateSelfDTO {
  phone?: string;
  emergencyContact?: EmergencyContact;
}
