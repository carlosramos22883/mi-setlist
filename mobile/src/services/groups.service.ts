// ============================================================
// GROUPS SERVICE (móvil) — llamadas al CRUD de grupos
// ============================================================
import { Platform } from 'react-native';
import { api } from './api';

export interface GroupMember {
  id: string;
  user: { id: string; name: string; email: string };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: 'band' | 'choir' | 'orchestra' | 'vocal_group' | 'other';
  logoPath: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  myRole: 'owner' | 'admin' | 'member';
  memberCount: number;
}

export interface GroupDetail extends Omit<Group, 'memberCount'> {
  members: GroupMember[];
}

export interface GroupsPage {
  data: Group[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// GET /groups?page=&limit=
export async function listMyGroups(params: { page?: number; limit?: number }) {
  const { data } = await api.get<GroupsPage>('/groups', { params });
  return data;
}

// GET /groups/:id
export async function getGroup(id: string) {
  const { data } = await api.get<GroupDetail>(`/groups/${id}`);
  return data;
}

// POST /groups
export async function createGroup(payload: {
  name: string;
  description?: string;
  type: 'band' | 'choir' | 'orchestra' | 'vocal_group' | 'other';
  logoPath?: string;
}) {
  const { data } = await api.post<Group>(`/groups`, payload);
  return data;
}

// PATCH /groups/:id
export async function updateGroup(
  id: string,
  payload: {
    name?: string;
    description?: string;
    type?: 'band' | 'choir' | 'orchestra' | 'vocal_group' | 'other';
    logoPath?: string;
  },
) {
  const { data } = await api.patch<Group>(`/groups/${id}`, payload);
  return data;
}

// DELETE /groups/:id
export async function deleteGroup(id: string) {
  const { data } = await api.delete<{ message: string }>(`/groups/${id}`);
  return data;
}

// POST /groups/:id/members — invitar
export async function inviteMember(
  groupId: string,
  payload: { email: string; role: 'admin' | 'member' },
) {
  const { data } = await api.post<{
    message: string;
    invitation: { id: string; email: string; role: string; expiresAt: string };
  }>(`/groups/${groupId}/members`, payload);
  return data;
}

// PATCH /groups/:id/members/:memberId — cambiar rol
export async function updateMemberRole(
  groupId: string,
  memberId: string,
  role: 'admin' | 'member',
) {
  const { data } = await api.patch<GroupMember>(
    `/groups/${groupId}/members/${memberId}`,
    { role },
  );
  return data;
}

// DELETE /groups/:id/members/:memberId — expulsar
export async function removeMember(groupId: string, memberId: string) {
  const { data } = await api.delete<{ message: string }>(
    `/groups/${groupId}/members/${memberId}`,
  );
  return data;
}

// POST /groups/:id/leave — abandonar
export async function leaveGroup(groupId: string) {
  const { data } = await api.post<{ message: string }>(`/groups/${groupId}/leave`);
  return data;
}

// POST /uploads/image — sube el logo (funciona en web y en móvil)
export async function uploadLogo(localUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // En web el picker devuelve data/blob URL → lo convertimos a Blob
    const res = await fetch(localUri);
    const blob = await res.blob();
    const filename = localUri.split('/').pop()?.split('?')[0] || 'logo.jpg';
    formData.append('file', blob, filename);
  } else {
    // En móvil nativo, RN entiende { uri, name, type }
    const filename = localUri.split('/').pop() ?? 'logo.jpg';
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: 'image/jpeg',
    } as any);
  }

  const { data } = await api.post<{ path: string }>('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.path;
}