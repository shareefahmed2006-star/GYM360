import { ApiResponse, ApiError, NetworkError } from './types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'gym360_token';

let isRedirecting = false;

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save token to localStorage', err);
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear token from localStorage', err);
  }
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers = {}, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getToken();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
    });
  } catch (err) {
    throw new NetworkError();
  }

  // Parse body safely
  let data: ApiResponse<T>;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      success: response.ok,
      message: text,
    };
  }

  if (!response.ok) {
    const statusCode = response.status;
    const errorMessage = data?.error?.message || response.statusText || 'An error occurred';

    // SPECIAL RULE 1: If 401 occurs on POST /api/auth/login, do NOT trigger session expiration redirect
    const isLoginEndpoint = endpoint.includes('/auth/login');

    if (statusCode === 401 && !isLoginEndpoint) {
      // Authenticated request returned 401: Clear local session state
      clearToken();

      // Ensure we do not get stuck in redirect loop or fire multiple redirects
      const isAlreadyOnLogin = window.location.pathname === '/login';
      if (!isAlreadyOnLogin && !isRedirecting) {
        isRedirecting = true;
        // Schedule navigation and reset latch shortly after
        window.location.href = '/login?expired=true';
        setTimeout(() => {
          isRedirecting = false;
        }, 1500);
      }
    }

    throw new ApiError(errorMessage, statusCode);
  }

  return data;
}
