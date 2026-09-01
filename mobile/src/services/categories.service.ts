// ============================================================
// CATEGORIES SERVICE (móvil)
// ============================================================
import { api } from './api';

export interface SongCategory {
  id: string;
  groupId: string;
  name: string;
  color: string | null;
  _count?: { songs: number };
}

export async function listCategories(groupId: string) {
  const { data } = await api.get<SongCategory[]>(`/groups/${groupId}/categories`);
  return data;
}

export async function createCategory(groupId: string, payload: { name: string; color?: string }) {
  const { data } = await api.post<SongCategory>(`/groups/${groupId}/categories`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete<{ message: string }>(`/song-categories/${id}`);
  return data;
}

export async function addCategoryToSong(songId: string, categoryId: string) {
  const { data } = await api.post<{ message: string }>(`/songs/${songId}/categories`, { categoryId });
  return data;
}

export async function removeCategoryFromSong(songId: string, categoryId: string) {
  const { data } = await api.delete<{ message: string }>(`/songs/${songId}/categories/${categoryId}`);
  return data;
}