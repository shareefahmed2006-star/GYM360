export type UserRole = 'admin' | 'member' | 'trainer';

export interface User {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  memberId?: string;
  trainerId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDTO) => Promise<User>;
  logout: () => Promise<void>;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: User;
  token: string;
}

export interface GetMeResponseData {
  user: User;
}
