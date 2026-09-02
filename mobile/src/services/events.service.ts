// ============================================================
// EVENTS SERVICE (móvil)
// ============================================================
import { api } from './api';

export type AttendanceStatus = 'confirmed' | 'declined' | 'maybe';

export interface EventItem {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  startsAt: string;
  endsAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  myStatus?: AttendanceStatus | null;
  attendeeCount?: number;
  setlistCount?: number;
}

export interface EventAttendee {
  id: string;
  status: string;
  user: { id: string; name: string; avatarPath: string | null };
}

export interface EventSetlistLink {
  id: string;
  setlist: { id: string; name: string; _count: { songs: number } };
}

export interface EventDetail extends EventItem {
  attendees: EventAttendee[];
  setlists: EventSetlistLink[];
}

export interface EventsPage {
  data: EventItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// GET /groups/:groupId/events
export async function listEvents(
  groupId: string,
  params: { search?: string; upcoming?: boolean; page?: number; limit?: number } = {},
) {
  const { data } = await api.get<EventsPage>(`/groups/${groupId}/events`, { params });
  return data;
}

// GET /events/:id
export async function getEvent(id: string) {
  const { data } = await api.get<EventDetail>(`/events/${id}`);
  return data;
}

// POST /groups/:groupId/events
export async function createEvent(
  groupId: string,
  payload: {
    title: string;
    description?: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    startsAt: string;
  },
) {
  const { data } = await api.post<EventItem>(`/groups/${groupId}/events`, payload);
  return data;
}

// PATCH /events/:id
export async function updateEvent(id: string, payload: Partial<EventItem>) {
  const { data } = await api.patch<EventItem>(`/events/${id}`, payload);
  return data;
}

// DELETE /events/:id
export async function deleteEvent(id: string) {
  const { data } = await api.delete<{ message: string }>(`/events/${id}`);
  return data;
}

// PUT /events/:id/attend
export async function setAttendance(eventId: string, status: AttendanceStatus) {
  const { data } = await api.put<EventAttendee>(`/events/${eventId}/attend`, { status });
  return data;
}

// DELETE /events/:id/attend
export async function removeAttendance(eventId: string) {
  const { data } = await api.delete<{ message: string }>(`/events/${eventId}/attend`);
  return data;
}

// POST /events/:id/setlists
export async function addSetlistToEvent(eventId: string, setlistId: string) {
  const { data } = await api.post<{ message: string }>(`/events/${eventId}/setlists`, { setlistId });
  return data;
}

// DELETE /events/:id/setlists/:setlistId
export async function removeSetlistFromEvent(eventId: string, setlistId: string) {
  const { data } = await api.delete<{ message: string }>(`/events/${eventId}/setlists/${setlistId}`);
  return data;
}