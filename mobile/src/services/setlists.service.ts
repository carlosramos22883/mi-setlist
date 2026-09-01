// ============================================================
// SETLISTS SERVICE (móvil) — llamadas al CRUD de setlists
// ============================================================
import { api } from './api';
import type { Song } from './songs.service';

export interface Setlist {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  songCount?: number;
}

export interface SetlistSong {
  id: string;
  setlistId: string;
  songId: string;
  position: number;
  customKey: string | null;
  notes: string | null;
  song: Song;
}

export interface SetlistDetail extends Setlist {
  songs: SetlistSong[];
}

export interface SetlistsPage {
  data: Setlist[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// GET /groups/:groupId/setlists
export async function listSetlists(
  groupId: string,
  params: { search?: string; page?: number; limit?: number } = {},
) {
  const { data } = await api.get<SetlistsPage>(`/groups/${groupId}/setlists`, { params });
  return data;
}

// GET /setlists/:id
export async function getSetlist(id: string) {
  const { data } = await api.get<SetlistDetail>(`/setlists/${id}`);
  return data;
}

// POST /groups/:groupId/setlists
export async function createSetlist(groupId: string, payload: { name: string; description?: string }) {
  const { data } = await api.post<Setlist>(`/groups/${groupId}/setlists`, payload);
  return data;
}

// PATCH /setlists/:id
export async function updateSetlist(id: string, payload: { name?: string; description?: string }) {
  const { data } = await api.patch<Setlist>(`/setlists/${id}`, payload);
  return data;
}

// DELETE /setlists/:id
export async function deleteSetlist(id: string) {
  const { data } = await api.delete<{ message: string }>(`/setlists/${id}`);
  return data;
}

// POST /setlists/:id/songs
export async function addSongToSetlist(
  setlistId: string,
  payload: { songId: string; customKey?: string; notes?: string },
) {
  const { data } = await api.post<SetlistSong>(`/setlists/${setlistId}/songs`, payload);
  return data;
}

// DELETE /setlists/:id/songs/:songId
export async function removeSongFromSetlist(setlistId: string, songId: string) {
  const { data } = await api.delete<{ message: string }>(`/setlists/${setlistId}/songs/${songId}`);
  return data;
}

// PATCH /setlists/:id/songs/:songId
export async function updateSetlistSong(
  setlistId: string,
  songId: string,
  payload: { customKey?: string; notes?: string },
) {
  const { data } = await api.patch<SetlistSong>(`/setlists/${setlistId}/songs/${songId}`, payload);
  return data;
}

// PATCH /setlists/:id/reorder
export async function reorderSetlist(
  setlistId: string,
  songs: { songId: string; position: number }[],
) {
  const { data } = await api.patch<SetlistSong[]>(`/setlists/${setlistId}/reorder`, { songs });
  return data;
}