import { apiClient } from './apiClient';
import {
  DashboardAnalyticsResponse,
  RevenueMetricsResponse,
  AttendanceAnalyticsResponse,
  MembershipRetentionResponse,
} from '../types/analytics.types';

export const analyticsApi = {
  getDashboard: async (branchId?: string): Promise<DashboardAnalyticsResponse> => {
    const res = await apiClient<DashboardAnalyticsResponse>('/analytics/dashboard', {
      method: 'GET',
      params: branchId ? { branchId } : undefined,
    });
    if (!res.data) throw new Error('Missing dashboard analytics data');
    return res.data;
  },

  getRevenue: async (
    startDate?: string,
    endDate?: string,
    branchId?: string
  ): Promise<RevenueMetricsResponse> => {
    const params: Record<string, string | undefined> = {};
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    if (branchId) {
      params.branchId = branchId;
    }

    const res = await apiClient<RevenueMetricsResponse>('/analytics/revenue', {
      method: 'GET',
      params,
    });
    if (!res.data) throw new Error('Missing revenue analytics data');
    return res.data;
  },

  getAttendance: async (
    date?: string,
    branchId?: string
  ): Promise<AttendanceAnalyticsResponse> => {
    const params: Record<string, string | undefined> = {};
    if (date) params.date = date;
    if (branchId) params.branchId = branchId;

    const res = await apiClient<AttendanceAnalyticsResponse>('/analytics/attendance', {
      method: 'GET',
      params,
    });
    if (!res.data) throw new Error('Missing attendance analytics data');
    return res.data;
  },

  getMembershipRetention: async (
    daysAhead?: number,
    branchId?: string
  ): Promise<MembershipRetentionResponse> => {
    const params: Record<string, string | number | undefined> = {};
    if (daysAhead !== undefined) params.daysAhead = daysAhead;
    if (branchId) params.branchId = branchId;

    const res = await apiClient<MembershipRetentionResponse>('/analytics/membership-retention', {
      method: 'GET',
      params,
    });
    if (!res.data) throw new Error('Missing retention analytics data');
    return res.data;
  },
};
