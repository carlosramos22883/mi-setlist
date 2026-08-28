// ============================================================
// USERS SERVICE (móvil) — llamadas al CRUD de usuarios
// ============================================================
import { api } from './api';

// Usuario tal como lo devuelve GET /users (roles como objetos)
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  avatarPath: string | null;
  deletedAt: string | null;
  createdAt: string;
  roles: { id: string; name: string }[];
}

export interface UsersPage {
  data: AdminUser[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// GET /users?search=&page=&limit=
export async function listUsers(params: { search?: string; page?: number; limit?: number; includeDeleted?: boolean; }) {
  const { data } = await api.get<UsersPage>('/users', { params });
  return data;
}

// POST /users
export async function createUser(payload: {
  name: string; email: string; password: string; roleIds?: string[];
}) {
  const { data } = await api.post<AdminUser>('/users', payload);
  return data;
}

// PATCH /users/:id
export async function updateUser(id: string, payload: {
  name?: string; email?: string; password?: string; roleIds?: string[]; avatarPath?: string;
}) {
  const { data } = await api.patch<AdminUser>(`/users/${id}`, payload);
  return data;
}

// DELETE /users/:id
export async function deleteUser(id: string) {
  const { data } = await api.delete<{ message: string }>(`/users/${id}`);
  return data;
}