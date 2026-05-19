export type UserRole = 'CLIENT' | 'FREELANCER' | 'BOTH';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole | null;
  phone?: string | null;
  city?: string | null;
  bio?: string | null;
  specialty?: string | null;
  startingPrice?: number | null;
  isAvailable?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'mediavault_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

interface ApiOptions extends RequestInit {
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Request gagal');
  }

  return payload as T;
}

export function dashboardPathForRole(role: UserRole | null) {
  if (role === 'FREELANCER') return '/dashboard/freelancer';
  if (role === 'CLIENT' || role === 'BOTH') return '/dashboard/client';
  return '/role-select';
}
