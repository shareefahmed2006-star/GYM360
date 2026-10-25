import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerApi } from '../api/trainerApi';
import {
  CreateTrainerDTO,
  UpdateTrainerDTO,
  TrainerFilterParams,
} from '../types/trainer.types';

export const useTrainers = (filters?: TrainerFilterParams) => {
  return useQuery({
    queryKey: ['trainers', filters ?? {}],
    queryFn: () => trainerApi.listTrainers(filters),
  });
};

export const useTrainer = (trainerId: string | undefined) => {
  return useQuery({
    queryKey: ['trainer', trainerId],
    queryFn: () => {
      if (!trainerId) throw new Error('Trainer ID is required');
      return trainerApi.getTrainerById(trainerId);
    },
    enabled: !!trainerId,
  });
};

export const useTrainerAvailability = (trainerId: string | undefined) => {
  return useQuery({
    queryKey: ['trainer-availability', trainerId],
    queryFn: () => {
      if (!trainerId) throw new Error('Trainer ID is required');
      return trainerApi.listAvailability(trainerId);
    },
    enabled: !!trainerId,
  });
};

export const useCreateTrainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTrainerDTO) => trainerApi.createTrainer(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
};

export const useUpdateTrainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trainerId,
      dto,
    }: {
      trainerId: string;
      dto: UpdateTrainerDTO;
    }) => trainerApi.updateTrainer(trainerId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', variables.trainerId] });
    },
  });
};

export const useDeleteTrainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trainerId: string) => trainerApi.deleteTrainer(trainerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
};
