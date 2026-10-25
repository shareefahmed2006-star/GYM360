import { apiClient } from './apiClient';
import { OrganizationDocument, UpdateOrganizationDTO } from '../types/organization.types';

export const organizationApi = {
  getOrganization: async (): Promise<OrganizationDocument> => {
    const res = await apiClient<{ organization: OrganizationDocument }>('/organization', {
      method: 'GET',
    });
    if (!res.data?.organization) {
      throw new Error('Organization data missing from response.');
    }
    return res.data.organization;
  },

  updateOrganization: async (
    dto: UpdateOrganizationDTO
  ): Promise<OrganizationDocument> => {
    const res = await apiClient<{ organization: OrganizationDocument }>('/organization', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (!res.data?.organization) {
      throw new Error('Updated organization data missing from response.');
    }
    return res.data.organization;
  },
};
