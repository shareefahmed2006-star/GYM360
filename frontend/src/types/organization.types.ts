export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface OrganizationDocument {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  status: 'active' | 'inactive';
}

export interface UpdateOrganizationDTO {
  name?: string;
  email?: string;
  phone?: string;
  address?: Partial<Address>;
}
