import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';
import {
  CreateNotificationDTO,
  UpdateNotificationStatusDTO,
  NotificationFilterParams,
} from '../types/notification.types';

export const useNotifications = (filters?: NotificationFilterParams) => {
  return useQuery({
    queryKey: ['notifications', filters ?? {}],
    queryFn: () => notificationApi.listNotifications(filters),
  });
};

export const useNotification = (notificationId: string | undefined) => {
  return useQuery({
    queryKey: ['notification', notificationId],
    queryFn: () => {
      if (!notificationId) throw new Error('Notification ID is required');
      return notificationApi.getNotificationById(notificationId);
    },
    enabled: !!notificationId,
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateNotificationDTO) =>
      notificationApi.createNotification(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdateNotificationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      dto,
    }: {
      notificationId: string;
      dto: UpdateNotificationStatusDTO;
    }) => notificationApi.updateNotificationStatus(notificationId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', variables.notificationId] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
