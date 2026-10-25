import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, AuthState, LoginDTO } from '../types/auth.types';
import { authApi } from '../api/authApi';
import { getToken, clearToken } from '../api/apiClient';

export const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Restore authenticated session on mount if token is present
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setTokenState(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { user: meUser } = await authApi.getMe();
        if (isMounted) {
          setUser(meUser);
          setTokenState(storedToken);
        }
      } catch {
        // Token is invalid/expired
        clearToken();
        if (isMounted) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginDTO): Promise<User> => {
      const { user: loggedInUser, token: receivedToken } = await authApi.login(credentials);
      setUser(loggedInUser);
      setTokenState(receivedToken);
      return loggedInUser;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      clearToken();
      setUser(null);
      setTokenState(null);
      // Invalidate and remove all cached query data for tenant safety
      queryClient.clear();
    }
  }, [queryClient]);

  const value: AuthState = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
