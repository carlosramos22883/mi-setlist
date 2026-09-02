// ============================================================
// EVENT DETAIL SCREEN — asistencia, setlists y ubicación
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Linking, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as EventsService from '../services/events.service';
import type { AttendanceStatus, EventDetail } from '../services/events.service';
import * as SetlistsService from '../services/setlists.service';
import type { Setlist } from '../services/setlists.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showSuccess } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import EventFormModal from '../components/EventFormModal';

const STATUS_META: Record<AttendanceStatus, { label: string; icon: string; color: string }> = {
  confirmed: { label: 'Asistiré', icon: '✅', color: '#0B6E4F' },
  maybe: { label: 'Tal vez', icon: '🤔', color: '#B45309' },
  declined: { label: 'No iré', icon: '❌', color: '#DC3545' },
};

interface Props {
  eventId: string;
  groupId: string;
  groupName: string;
  myRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
}

export default function EventDetailScreen({
  eventId, groupId, groupName, myRole, onBack,
}: Props) {
  const { can, user } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [setlistModalVisible, setSetlistModalVisible] = useState(false);
  const [groupSetlists, setGroupSetlists] = useState<Setlist[]>([]);
  const [loadingSetlists, setLoadingSetlists] = useState(false);

  // Doble capa
  const canManage = can('events.edit') && (myRole === 'owner' || myRole === 'admin');
  const canDelete = can('events.delete') && (myRole === 'owner' || myRole === 'admin');

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await EventsService.getEvent(eventId);
      setEvent(data);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  // ---------------------------------------------------------
  // ASISTENCIA: tap = responder; tap al estado actual = quitar
  // ---------------------------------------------------------
  async function handleAttendance(status: AttendanceStatus) {
    if (!event) return;
    if (event.myStatus === status) {
      await EventsService.removeAttendance(eventId);
    } else {
      await EventsService.setAttendance(eventId, status);
    }
    await loadEvent();
  }

  // ---------------------------------------------------------
  // UBICACIÓN: enlace a Google Maps (web) / listo para MapView (nativo)
  // ---------------------------------------------------------
  function mapsUrl(): string | null {
    if (!event) return null;
    if (event.latitude != null && event.longitude != null) {
      return `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
    }
    if (event.address) return `https://maps.google.com/?q=${encodeURIComponent(event.address)}`;
    if (event.location) return `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
    return null;
  }

  // ---------------------------------------------------------
  // SETLISTS DEL EVENTO
  // ---------------------------------------------------------
  async function openSetlistModal() {
    setSetlistModalVisible(true);
    setLoadingSetlists(true);
    try {
      const res = await SetlistsService.listSetlists(groupId, { limit: 50 });
      setGroupSetlists(res.data);
    } finally {
      setLoadingSetlists(false);
    }
  }

  async function handleAddSetlist(setlist: Setlist) {
    await EventsService.addSetlistToEvent(eventId, setlist.id);
    showSuccess('Éxito', `"${setlist.name}" asociado al evento`);
    await loadEvent();
  }

  function handleRemoveSetlist(setlistId: string, name: string) {
    confirmAction(
      'Quitar setlist',
      `¿Quitar "${name}" del evento?`,
      async () => {
        await EventsService.removeSetlistFromEvent(eventId, setlistId);
        showSuccess('Éxito', 'Setlist quitado');
        await loadEvent();
      },
    );
  }

  async function handleEditSubmit(payload: any) {
    await EventsService.updateEvent(eventId, payload);
    showSuccess('Éxito', 'Evento actualizado');
    await loadEvent();
  }

  function handleDelete() {
    if (!event) return;
    confirmAction(
      'Eliminar evento',
      `¿Eliminar "${event.title}"?`,
      async () => {
        await EventsService.deleteEvent(eventId);
        showSuccess('Éxito', 'Evento eliminado');
        onBack();
      },
    );
  }

  if (loading) {
    return (
      <View style={[globalStyles.screen, s.loadingWrap]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[globalStyles.screen, s.loadingWrap]}>
        <Text style={s.empty}>Evento no encontrado</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={globalStyles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const d = new Date(event.startsAt);
  const url = mapsUrl();
  const myStatus = (event.attendees.find((a) => a.user.id === user?.id)?.status as AttendanceStatus) ?? null;
  // myStatus lo calculamos del detalle: buscamos mi registro por comparación con el usuario actual
  const counts = { confirmed: 0, maybe: 0, declined: 0 } as Record<AttendanceStatus, number>;
  event.attendees.forEach((a) => {
    if (a.status in counts) counts[a.status as AttendanceStatus] += 1;
  });

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={s.scroll}>
        <ScreenHeader title={event.title} subtitle={groupName} onBack={onBack} />

        {/* Cuándo y dónde */}
        <View style={s.card}>
          <Text style={s.bigDate}>
            {d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={s.bigTime}>
            🕐 {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            {event.endsAt
              ? ` – ${new Date(event.endsAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </Text>

          {event.description && <Text style={s.description}>{event.description}</Text>}

          {(event.location || event.address) && (
            <View style={s.locationBox}>
              {event.location && <Text style={s.locationName}>📍 {event.location}</Text>}
              {event.address && <Text style={s.locationAddress}>{event.address}</Text>}
              {url && (
                <TouchableOpacity
                  style={[globalStyles.button, s.mapsBtn]}
                  onPress={() => Linking.openURL(url)}
                >
                  <Text style={globalStyles.buttonText}>🗺️ Cómo llegar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Mi asistencia */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>¿Asistirás?</Text>
          <View style={s.attendRow}>
            {(Object.keys(STATUS_META) as AttendanceStatus[]).map((st) => {
              const meta = STATUS_META[st];
              const active = myStatus === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[s.attendBtn, active && { backgroundColor: meta.color, borderColor: meta.color }]}
                  onPress={() => handleAttendance(st)}
                >
                  <Text style={[s.attendBtnText, active && { color: '#FFFFFF' }]}>
                    {meta.icon} {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={s.countsLine}>
            ✅ {counts.confirmed} · 🤔 {counts.maybe} · ❌ {counts.declined}
          </Text>

          {event.attendees.length > 0 && (
            <View style={s.attendeesBox}>
              {event.attendees.map((a) => (
                <View key={a.id} style={s.attendeeRow}>
                  <Text style={s.attendeeName}>{a.user.name}</Text>
                  <Text style={{ color: STATUS_META[a.status as AttendanceStatus]?.color ?? c.textMuted, fontSize: 12, fontWeight: '700' }}>
                    {STATUS_META[a.status as AttendanceStatus]?.icon ?? '❓'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Setlists del evento */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.sectionTitle}>🎼 Setlists del evento</Text>
            {canManage && (
              <TouchableOpacity style={s.addChip} onPress={openSetlistModal}>
                <Text style={s.addChipText}>+ Agregar</Text>
              </TouchableOpacity>
            )}
          </View>

          {event.setlists.length === 0 ? (
            <Text style={s.emptySmall}>Aún no hay setlists asociados</Text>
          ) : (
            event.setlists.map((link) => (
              <View key={link.id} style={s.setlistRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.setlistName}>{link.setlist.name}</Text>
                  <Text style={s.setlistMeta}>🎵 {link.setlist._count.songs} canciones</Text>
                </View>
                {canManage && (
                  <TouchableOpacity
                    style={[s.iconBtn, s.iconDanger]}
                    onPress={() => handleRemoveSetlist(link.setlist.id, link.setlist.name)}
                  >
                    <Ionicons name="close" size={16} color={c.text} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Acciones */}
        <View style={s.actionsRow}>
          {canManage && (
            <TouchableOpacity
              style={[globalStyles.button, s.halfBtn]}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={globalStyles.buttonText}>✏️ Editar</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[globalStyles.buttonDanger, s.halfBtn]}
              onPress={handleDelete}
            >
              <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal de edición */}
      <EventFormModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        initialEvent={event}
        title={`Editar: ${event.title}`}
        submitLabel="Guardar cambios"
      />

      {/* Modal de setlists disponibles */}
      <Modal
        visible={setlistModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSetlistModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Agregar setlist</Text>
            {loadingSetlists ? (
              <ActivityIndicator color={c.primary} style={{ marginVertical: 24 }} />
            ) : (
              <FlatList
                data={groupSetlists.filter(
                  (sl) => !event.setlists.some((l) => l.setlist.id === sl.id),
                )}
                keyExtractor={(item) => item.id}
                style={s.setlistList}
                ListEmptyComponent={<Text style={s.emptySmall}>No hay más setlists disponibles</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.setlistRow} onPress={() => handleAddSetlist(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.setlistName}>{item.name}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={c.primary} />
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[globalStyles.button, { marginTop: 12 }]}
              onPress={() => setSetlistModalVisible(false)}
            >
              <Text style={globalStyles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    loadingWrap: { alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 24, paddingTop: 16 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
    emptySmall: { color: c.textMuted, fontStyle: 'italic', paddingVertical: 12 },
    card: {
      backgroundColor: c.surface, borderRadius: 16, padding: 20,
      marginBottom: 16, borderWidth: 1, borderColor: c.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: {
      color: c.textSecondary, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', marginBottom: 12,
    },
    bigDate: { color: c.text, fontSize: 17, fontWeight: '800', textTransform: 'capitalize' },
    bigTime: { color: c.textSecondary, fontSize: 14, marginTop: 4 },
    description: { color: c.textSecondary, fontSize: 14, marginTop: 12, lineHeight: 20 },
    locationBox: { marginTop: 14 },
    locationName: { color: c.text, fontSize: 15, fontWeight: '700' },
    locationAddress: { color: c.textSecondary, fontSize: 13, marginTop: 2, marginBottom: 10 },
    mapsBtn: { marginTop: 10, paddingVertical: 10 },
    attendRow: { flexDirection: 'row', gap: 10 },
    attendBtn: {
      flex: 1, alignItems: 'center', paddingVertical: 12,
      borderRadius: 9999, backgroundColor: c.surface2,
      borderWidth: 1, borderColor: c.border,
    },
    attendBtnText: { color: c.text, fontSize: 13, fontWeight: '700' },
    countsLine: { color: c.textSecondary, fontSize: 12, marginTop: 10, textAlign: 'center' },
    attendeesBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
    attendeeRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 6,
    },
    attendeeName: { color: c.text, fontSize: 14, fontWeight: '600' },
    addChip: {
      borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: c.border, borderStyle: 'dashed',
    },
    addChipText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    setlistRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    setlistName: { color: c.text, fontSize: 14, fontWeight: '700' },
    setlistMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    setlistList: { maxHeight: 280 },
    iconBtn: {
      backgroundColor: c.surface2, borderRadius: 8, padding: 8,
      alignItems: 'center', borderWidth: 1, borderColor: c.border,
    },
    iconDanger: { backgroundColor: 'rgba(220, 53, 69, 0.15)' },
    actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    halfBtn: { flex: 1, paddingVertical: 12 },
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', padding: 24,
    },
    modalCard: { backgroundColor: c.surface, borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  });