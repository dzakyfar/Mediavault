export type UserRole = 'CLIENT' | 'FREELANCER' | 'BOTH';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  avatarKey?: string | null;
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
const API_TIMEOUT_MS = 120000;

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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timeout. Pastikan backend berjalan dan VITE_API_URL sudah benar.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;
  const textPayload = isJson ? '' : await response.text().catch(() => '');

  if (!response.ok) {
    const message = payload?.message || textPayload?.slice(0, 160);
    throw new Error(message || `Request gagal (${response.status})`);
  }

  return payload as T;
}

export function dashboardPathForRole(role: UserRole | null) {
  if (role === 'FREELANCER') return '/dashboard/freelancer';
  if (role === 'CLIENT' || role === 'BOTH') return '/dashboard/client';
  return '/role-select';
}
