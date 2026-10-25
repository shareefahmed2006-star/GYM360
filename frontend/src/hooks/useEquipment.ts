import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '../api/equipmentApi';
import {
  CreateEquipmentDTO,
  UpdateEquipmentDTO,
  UpdateEquipmentStatusDTO,
  EquipmentFilterParams,
} from '../types/equipment.types';

export const useEquipmentList = (filters?: EquipmentFilterParams) => {
  return useQuery({
    queryKey: ['equipment-list', filters ?? {}],
    queryFn: () => equipmentApi.listEquipment(filters),
  });
};

export const useEquipment = (equipmentId: string | undefined) => {
  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => {
      if (!equipmentId) throw new Error('Equipment ID is required');
      return equipmentApi.getEquipmentById(equipmentId);
    },
    enabled: !!equipmentId,
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateEquipmentDTO) => equipmentApi.createEquipment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentId,
      dto,
    }: {
      equipmentId: string;
      dto: UpdateEquipmentDTO;
    }) => equipmentApi.updateEquipment(equipmentId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.equipmentId] });
    },
  });
};

export const useUpdateEquipmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentId,
      dto,
    }: {
      equipmentId: string;
      dto: UpdateEquipmentStatusDTO;
    }) => equipmentApi.updateEquipmentStatus(equipmentId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.equipmentId] });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentId: string) => equipmentApi.deleteEquipment(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
    },
  });
};
