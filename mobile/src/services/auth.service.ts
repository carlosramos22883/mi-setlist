// ============================================================
// AUTH SERVICE — las llamadas a los endpoints /auth de tu API
// ============================================================
import { api } from './api';

// Tipos = la "forma" de los datos que devuelve el backend
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// POST /auth/register
export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return data;
}

// POST /auth/login
export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

// GET /auth/me (el interceptor adjunta el Bearer token)
export async function me() {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}

// POST /auth/refresh (rotación de tokens)
export async function refresh(refreshToken: string) {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
    '/auth/refresh',
    { refreshToken },
  );
  return data;
}

// POST /auth/logout
export async function logout(refreshToken?: string | null) {
  const { data } = await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
  return data;
}

// POST /auth/forgot-password — devuelve siempre el mismo mensaje genérico
export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
}

// POST /auth/reset-password — usa el token del correo
export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
  return data;
}