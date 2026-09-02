// ============================================================
// EVENTS SCREEN — lista de eventos con filtro próximos/pasados
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as EventsService from '../services/events.service';
import type { EventItem } from '../services/events.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showSuccess } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import ListToolbar from '../components/ListToolbar';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import RowActions from '../components/RowActions';
import EventFormModal from '../components/EventFormModal';

const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

const STATUS_META: Record<string, { label: string; color: string }> = {
  confirmed: { label: '✅ Asistiré', color: '#0B6E4F' },
  maybe: { label: '🤔 Tal vez', color: '#B45309' },
  declined: { label: '❌ No iré', color: '#DC3545' },
};

type Filter = 'upcoming' | 'past' | 'all';

interface Props {
  groupId: string;
  groupName: string;
  myRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
}

export default function EventsScreen({
  groupId, groupName, myRole, onBack, onOpenEvent,
}: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Doble capa
  const canCreate = can('events.create') && (myRole === 'owner' || myRole === 'admin');
  const canEdit = can('events.edit') && (myRole === 'owner' || myRole === 'admin');
  const canDelete = can('events.delete') && (myRole === 'owner' || myRole === 'admin');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EventsService.listEvents(groupId, {
        page,
        limit: 10,
        search: search.trim() || undefined,
        upcoming: filter === 'all' ? undefined : filter === 'upcoming',
      });
      setEvents(res.data);
      setTotalPages(res.meta.totalPages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, page, search, filter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function handleDelete(event: EventItem) {
    confirmAction(
      'Eliminar evento',
      `¿Eliminar "${event.title}"?`,
      async () => {
        await EventsService.deleteEvent(event.id);
        showSuccess('Éxito', 'Evento eliminado');
        loadEvents();
      },
    );
  }

  async function handleModalSubmit(payload: any) {
    if (editingEvent) {
      await EventsService.updateEvent(editingEvent.id, payload);
      showSuccess('Éxito', 'Evento actualizado');
    } else {
      await EventsService.createEvent(groupId, payload);
      showSuccess('Éxito', 'Evento creado');
    }
    await loadEvents();
  }

  function renderEvent({ item }: { item: EventItem }) {
    const d = new Date(item.startsAt);
    const status = item.myStatus ? STATUS_META[item.myStatus] : null;
    return (
      <View style={s.card}>
        <TouchableOpacity
          style={s.cardBody}
          onPress={() => onOpenEvent(item.id)}
          activeOpacity={0.7}
        >
          {/* Badge de fecha */}
          <View style={s.dateBadge}>
            <Text style={s.dateDay}>{d.getDate()}</Text>
            <Text style={s.dateMonth}>{MESES[d.getMonth()]}</Text>
          </View>

          <View style={s.cardContent}>
            <Text style={s.eventTitle}>{item.title}</Text>
            {item.location && (
              <Text style={s.eventLocation} numberOfLines={1}>📍 {item.location}</Text>
            )}
            <Text style={s.eventTime}>
              🕐 {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={s.meta}>
              <View style={s.chip}>
                <Text style={s.chipText}>👥 {item.attendeeCount ?? 0}</Text>
              </View>
              {(item.setlistCount ?? 0) > 0 && (
                <View style={s.chip}>
                  <Text style={s.chipText}>🎼 {item.setlistCount}</Text>
                </View>
              )}
              {status && (
                <View style={[s.chip, { backgroundColor: status.color + '22' }]}>
                  <Text style={[s.chipText, { color: status.color }]}>{status.label}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <RowActions
          onEdit={() => { setEditingEvent(item); setModalVisible(true); }}
          onDelete={() => handleDelete(item)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={s.scroll}>
      <ScreenHeader title="Eventos" subtitle={groupName} onBack={onBack} />

      <ListToolbar
        search={search}
        onSearchChange={(t) => { setSearch(t); setPage(1); }}
        searchPlaceholder="Buscar evento o lugar..."
        onCreate={canCreate ? () => { setEditingEvent(null); setModalVisible(true); } : undefined}
        createLabel="+ Nuevo evento"
      />

      {/* Filtro próximos / pasados / todos */}
      <View style={s.filterRow}>
        {([
          { key: 'upcoming', label: 'Próximos' },
          { key: 'past', label: 'Pasados' },
          { key: 'all', label: 'Todos' },
        ] as { key: Filter; label: string }[]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => { setFilter(f.key); setPage(1); }}
          >
            <Text style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && events.length === 0 ? (
        <ActivityIndicator color={c.primary} style={s.loader} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvents(); }} />
          }
          ListEmptyComponent={<EmptyState message="No hay eventos en esta vista" icon="calendar-outline" />}
          scrollEnabled={false}
        />
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <EventFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialEvent={editingEvent}
        title={editingEvent ? `Editar: ${editingEvent.title}` : 'Nuevo evento'}
        submitLabel={editingEvent ? 'Guardar cambios' : 'Crear evento'}
      />
    </ScrollView>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { padding: 24, paddingTop: 16 },
    loader: { marginTop: 40 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    filterChip: {
      backgroundColor: c.surface2, borderRadius: 9999,
      paddingHorizontal: 14, paddingVertical: 7,
      borderWidth: 1, borderColor: c.border,
    },
    filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    filterChipText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    filterChipTextActive: { color: '#FFFFFF' },
    card: {
      backgroundColor: c.surface, borderRadius: 12, padding: 16,
      marginBottom: 12, flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: c.border,
    },
    cardBody: { flex: 1, flexDirection: 'row' },
    dateBadge: {
      width: 52, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.primarySoft, borderRadius: 12,
      paddingVertical: 8, marginRight: 12,
    },
    dateDay: { color: c.primary, fontSize: 20, fontWeight: '800', lineHeight: 22 },
    dateMonth: { color: c.primary, fontSize: 10, fontWeight: '700' },
    cardContent: { flex: 1 },
    eventTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    eventLocation: { color: c.textSecondary, fontSize: 13 },
    eventTime: { color: c.textSecondary, fontSize: 13, marginBottom: 8 },
    meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    chip: { backgroundColor: c.surface2, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 },
    chipText: { color: c.textSecondary, fontSize: 11, fontWeight: '600' },
  });