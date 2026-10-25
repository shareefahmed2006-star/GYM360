import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import {
  AttendanceFilterParams,
  CheckInDTO,
  CheckOutDTO,
} from '../types/attendance.types';

export const useAttendance = (filters?: AttendanceFilterParams) => {
  return useQuery({
    queryKey: ['attendance', filters ?? {}],
    queryFn: () => attendanceApi.listAttendance(filters),
  });
};

export const useAttendanceRecord = (attendanceId: string | undefined) => {
  return useQuery({
    queryKey: ['attendance-record', attendanceId],
    queryFn: () => {
      if (!attendanceId) throw new Error('Attendance ID is required');
      return attendanceApi.getAttendanceById(attendanceId);
    },
    enabled: !!attendanceId,
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CheckInDTO) => attendanceApi.checkIn(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CheckOutDTO) => attendanceApi.checkOut(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attendanceId: string) => attendanceApi.deleteAttendance(attendanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
