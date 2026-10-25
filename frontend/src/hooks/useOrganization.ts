import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '../api/organizationApi';
import { UpdateOrganizationDTO } from '../types/organization.types';

export const useOrganization = () => {
  return useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationApi.getOrganization(),
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateOrganizationDTO) =>
      organizationApi.updateOrganization(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
};
