import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import {
  CreateMaintenanceLogDTO,
  UpdateMaintenanceLogDTO,
  UpdateMaintenanceLogStatusDTO,
  MaintenanceLogFilterParams,
} from '../types/maintenance.types';

export const useMaintenanceLogs = (filters?: MaintenanceLogFilterParams) => {
  return useQuery({
    queryKey: ['maintenance-logs', filters ?? {}],
    queryFn: () => maintenanceApi.listMaintenanceLogs(filters),
  });
};

export const useMaintenanceLog = (logId: string | undefined) => {
  return useQuery({
    queryKey: ['maintenance-log', logId],
    queryFn: () => {
      if (!logId) throw new Error('Maintenance log ID is required');
      return maintenanceApi.getMaintenanceLogById(logId);
    },
    enabled: !!logId,
  });
};

export const useCreateMaintenanceLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMaintenanceLogDTO) =>
      maintenanceApi.createMaintenanceLog(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
    },
  });
};

export const useUpdateMaintenanceLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      logId,
      dto,
    }: {
      logId: string;
      dto: UpdateMaintenanceLogDTO;
    }) => maintenanceApi.updateMaintenanceLog(logId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-log', variables.logId] });
    },
  });
};

export const useUpdateMaintenanceLogStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      logId,
      dto,
    }: {
      logId: string;
      dto: UpdateMaintenanceLogStatusDTO;
    }) => maintenanceApi.updateMaintenanceLogStatus(logId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-log', variables.logId] });
    },
  });
};

export const useDeleteMaintenanceLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => maintenanceApi.deleteMaintenanceLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
    },
  });
};
