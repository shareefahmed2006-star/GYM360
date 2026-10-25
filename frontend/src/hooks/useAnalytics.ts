import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';

export const useDashboardAnalytics = (branchId?: string) => {
  return useQuery({
    queryKey: ['analytics', 'dashboard', branchId ?? 'all'],
    queryFn: () => analyticsApi.getDashboard(branchId),
  });
};

export const useRevenueAnalytics = (
  startDate?: string,
  endDate?: string,
  branchId?: string
) => {
  return useQuery({
    queryKey: ['analytics', 'revenue', startDate ?? 'mtd', endDate ?? 'mtd', branchId ?? 'all'],
    queryFn: () => analyticsApi.getRevenue(startDate, endDate, branchId),
  });
};

export const useAttendanceAnalytics = (date?: string, branchId?: string) => {
  return useQuery({
    queryKey: ['analytics', 'attendance', date ?? 'today', branchId ?? 'all'],
    queryFn: () => analyticsApi.getAttendance(date, branchId),
  });
};

export const useRetentionAnalytics = (daysAhead?: number, branchId?: string) => {
  return useQuery({
    queryKey: ['analytics', 'retention', daysAhead ?? 30, branchId ?? 'all'],
    queryFn: () => analyticsApi.getMembershipRetention(daysAhead, branchId),
  });
};
