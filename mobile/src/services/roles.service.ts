// ============================================================
// ROLES SERVICE (móvil) — llamadas a roles y permisos
// ============================================================
import { api } from './api';

export interface Permission {
  id: string;
  name: string;
  group: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  usersCount: number;
  permissions: Permission[];
}

// GET /roles
export async function listRoles() {
  const { data } = await api.get<Role[]>('/roles');
  return data;
}

// GET /permissions — catálogo agrupado { users: [...], roles: [...], profile: [...] }
export async function listPermissions() {
  const { data } = await api.get<Record<string, Permission[]>>('/permissions');
  return data;
}

// POST /roles — crear un rol nuevo
export async function createRole(payload: {
  name: string;
  description?: string;
  permissionIds: string[];
}) {
  const { data } = await api.post<Role>('/roles', payload);
  return data;
}

// PATCH /roles/:id
export async function updateRole(id: string, payload: {
  name?: string; description?: string; permissionIds?: string[];
}) {
  const { data } = await api.patch<Role>(`/roles/${id}`, payload);
  return data;
}

// DELETE /roles/:id
export async function deleteRole(id: string) {
  const { data } = await api.delete<{ message: string }>(`/roles/${id}`);
  return data;
}