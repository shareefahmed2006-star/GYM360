import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthState } from '../types/auth.types';

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
