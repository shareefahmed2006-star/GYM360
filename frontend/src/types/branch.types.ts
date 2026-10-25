import { Address } from './organization.types';

export type BranchStatus = 'active' | 'inactive';

export interface BranchDocument {
  _id: string;
  organizationId: string;
  name: string;
  address: Address;
  phone: string;
  capacity: number;
  openingTime: string;
  closingTime: string;
  status: BranchStatus;
}

export interface CreateBranchDTO {
  name: string;
  address: Address;
  phone: string;
  capacity: number;
  openingTime: string;
  closingTime: string;
}

export interface UpdateBranchDTO {
  name?: string;
  address?: Partial<Address>;
  phone?: string;
  capacity?: number;
  openingTime?: string;
  closingTime?: string;
  status?: BranchStatus;
}
