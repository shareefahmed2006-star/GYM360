import { apiClient } from './apiClient';
import {
  TrainerDashboardData,
  TrainerSession,
  TrainerClient,
  AvailabilitySlot,
} from '../types/trainerPortal.types';

export const trainerPortalApi = {
  getDashboard: async (): Promise<TrainerDashboardData> => {
    const res = await apiClient<TrainerDashboardData>('/trainer-portal/dashboard');
    return res.data!;
  },

  listSessions: async (params?: {
    status?: string;
    date?: string;
  }): Promise<TrainerSession[]> => {
    const res = await apiClient<{ sessions: TrainerSession[] }>('/trainer-portal/sessions', {
      params,
    });
    return res.data?.sessions || [];
  },

  updateSessionStatus: async (
    sessionId: string,
    payload: { status: string; notes?: string }
  ): Promise<TrainerSession> => {
    const res = await apiClient<{ session: TrainerSession }>(
      `/trainer-portal/sessions/${sessionId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data!.session;
  },

  listClients: async (): Promise<TrainerClient[]> => {
    const res = await apiClient<{ clients: TrainerClient[] }>('/trainer-portal/clients');
    return res.data?.clients || [];
  },

  getAvailability: async (): Promise<AvailabilitySlot[]> => {
    const res = await apiClient<{ availability: AvailabilitySlot[] }>(
      '/trainer-portal/availability'
    );
    return res.data?.availability || [];
  },
};
