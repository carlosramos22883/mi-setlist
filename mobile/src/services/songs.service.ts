// ============================================================
// SONGS SERVICE (móvil) — llamadas al CRUD de canciones
// ============================================================
import { api } from './api';
import type { SongCategory } from './categories.service';

export interface Song {
  id: string;
  groupId: string;
  title: string;
  artist: string | null;
  author: string | null;
  lyrics: string;
  songKey: string | null;
  bpm: number | null;
  durationSeconds: number | null;
  language: string | null;
  genre: string | null;
  coverPath: string | null;
  categories?: SongCategory[];
  isFavorite?: boolean;
  favoriteCount?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
}

export interface SongsPage {
  data: Song[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface SongNote {
  id: string;
  songId: string;
  userId: string;
  content: string;
}

// GET /groups/:groupId/songs
export async function listSongs(
  groupId: string,
  params: { search?: string; page?: number; limit?: number; favoritesOnly?: boolean } = {},
) {
  const { data } = await api.get<SongsPage>(`/groups/${groupId}/songs`, { params });
  return data;
}

// GET /songs/:id
export async function getSong(id: string) {
  const { data } = await api.get<Song>(`/songs/${id}`);
  return data;
}

// POST /groups/:groupId/songs
export async function createSong(
  groupId: string,
  payload: {
    title: string;
    artist?: string;
    author?: string;
    lyrics?: string;
    songKey?: string;
    bpm?: number;
    durationSeconds?: number;
    language?: string;
    genre?: string;
  },
) {
  const { data } = await api.post<Song>(`/groups/${groupId}/songs`, payload);
  return data;
}

// PATCH /songs/:id
export async function updateSong(id: string, payload: Partial<Song>) {
  const { data } = await api.patch<Song>(`/songs/${id}`, payload);
  return data;
}

// DELETE /songs/:id
export async function deleteSong(id: string) {
  const { data } = await api.delete<{ message: string }>(`/songs/${id}`);
  return data;
}

// ---------- NOTA PERSONAL ----------
export async function getMyNote(songId: string) {
  const { data } = await api.get<SongNote | null>(`/songs/${songId}/notes/mine`);
  return data;
}

export async function upsertMyNote(songId: string, content: string) {
  const { data } = await api.put<SongNote>(`/songs/${songId}/notes/mine`, { content });
  return data;
}

export async function deleteMyNote(songId: string) {
  const { data } = await api.delete<{ message: string }>(`/songs/${songId}/notes/mine`);
  return data;
}

// ---------- FAVORITAS ----------
export async function addFavorite(songId: string) {
  const { data } = await api.post<{ message: string }>(`/songs/${songId}/favorite`);
  return data;
}

export async function removeFavorite(songId: string) {
  const { data } = await api.delete<{ message: string }>(`/songs/${songId}/favorite`);
  return data;
}