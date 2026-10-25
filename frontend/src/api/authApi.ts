import { apiClient, setToken, clearToken } from './apiClient';
import { LoginDTO, LoginResponseData, GetMeResponseData } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginDTO): Promise<LoginResponseData> => {
    const res = await apiClient<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!res.data?.token) {
      throw new Error('Malformed login response: token missing');
    }

    setToken(res.data.token);
    return res.data;
  },

  getMe: async (): Promise<GetMeResponseData> => {
    const res = await apiClient<GetMeResponseData>('/auth/me', {
      method: 'GET',
    });

    if (!res.data?.user) {
      throw new Error('Malformed getMe response: user data missing');
    }

    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Stateless logout: Even if the network call fails or server is unreachable,
      // client-side state MUST be purged unconditionally.
    } finally {
      clearToken();
    }
  },

  forgotPassword: async (
    email: string
  ): Promise<{ message: string; resetToken?: string; resetUrl?: string }> => {
    const res = await apiClient<{
      message: string;
      resetToken?: string;
      resetUrl?: string;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return res.data || { message: res.message || 'Password reset requested.' };
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const res = await apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });

    return res.data || { message: res.message || 'Password reset successfully.' };
  },
};
