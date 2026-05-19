import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiRequest,
  clearStoredToken,
  CurrentUser,
  getStoredToken,
  setStoredToken,
  UserRole,
} from '../lib/api';

interface AuthResponse {
  user: CurrentUser;
  token: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  register: (payload: { fullName: string; email: string; password: string }) => Promise<CurrentUser>;
  updateRole: (role: UserRole) => Promise<CurrentUser>;
  updateProfile: (payload: Partial<CurrentUser>) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      const token = getStoredToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<{ user: CurrentUser }>('/auth/me');
        if (mounted) setUser(response.user);
      } catch {
        clearStoredToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    async login(email, password) {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(response.token);
      setUser(response.user);
      return response.user;
    },
    async register(payload) {
      const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(payload),
      });
      setStoredToken(response.token);
      setUser(response.user);
      return response.user;
    },
    async updateRole(role) {
      const response = await apiRequest<{ user: CurrentUser }>('/auth/role', {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUser(response.user);
      return response.user;
    },
    async updateProfile(payload) {
      const response = await apiRequest<{ user: CurrentUser }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setUser(response.user);
      return response.user;
    },
    logout() {
      clearStoredToken();
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }

  return context;
}
