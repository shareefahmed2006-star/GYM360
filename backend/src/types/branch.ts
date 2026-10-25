import { ObjectId, Int32 } from 'mongodb';
import { Address } from './organization';

export interface BranchDocument {
  _id: ObjectId;
  organizationId: ObjectId;
  name: string;
  address: Address;
  phone: string;
  capacity: Int32 | number;
  openingTime: string;
  closingTime: string;
  status: 'active' | 'inactive';
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
  status?: 'active' | 'inactive';
}
