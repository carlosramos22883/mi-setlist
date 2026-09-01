// ============================================================
// SETLISTS SCREEN — lista de setlists de un grupo
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as SetlistsService from '../services/setlists.service';
import type { Setlist } from '../services/setlists.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showSuccess } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import ListToolbar from '../components/ListToolbar';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import RowActions from '../components/RowActions';
import SetlistFormModal from '../components/SetlistFormModal';

interface Props {
  groupId: string;
  groupName: string;
  myRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
  onOpenSetlist: (setlistId: string) => void;
}

export default function SetlistsScreen({
  groupId, groupName, myRole, onBack, onOpenSetlist,
}: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);

  // Doble capa
  const canCreate = can('setlists.create') && (myRole === 'owner' || myRole === 'admin');
  const canEdit = can('setlists.edit') && (myRole === 'owner' || myRole === 'admin');
  const canDelete = can('setlists.delete') && (myRole === 'owner' || myRole === 'admin');

  const loadSetlists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SetlistsService.listSetlists(groupId, {
        page, limit: 10, search: search.trim() || undefined,
      });
      setSetlists(res.data);
      setTotalPages(res.meta.totalPages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, page, search]);

  useEffect(() => { loadSetlists(); }, [loadSetlists]);

  function handleDelete(setlist: Setlist) {
    confirmAction(
      'Eliminar setlist',
      `¿Eliminar "${setlist.name}"?`,
      async () => {
        await SetlistsService.deleteSetlist(setlist.id);
        showSuccess('Éxito', 'Setlist eliminado');
        loadSetlists();
      },
    );
  }

  async function handleModalSubmit(payload: { name: string; description?: string }) {
    if (editingSetlist) {
      await SetlistsService.updateSetlist(editingSetlist.id, payload);
      showSuccess('Éxito', 'Setlist actualizado');
    } else {
      await SetlistsService.createSetlist(groupId, payload);
      showSuccess('Éxito', 'Setlist creado');
    }
    await loadSetlists();
  }

  function renderSetlist({ item }: { item: Setlist }) {
    return (
      <View style={s.card}>
        <TouchableOpacity
          style={s.cardBody}
          onPress={() => onOpenSetlist(item.id)}
          activeOpacity={0.7}
        >
          <View style={s.cardContent}>
            <Text style={s.setName}>{item.name}</Text>
            {item.description && (
              <Text style={s.setDescription} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={s.meta}>
              <View style={s.chip}>
                <Text style={s.chipText}>🎵 {item.songCount ?? 0} canciones</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <RowActions
          onEdit={() => { setEditingSetlist(item); setModalVisible(true); }}
          onDelete={() => handleDelete(item)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={s.scroll}>
      <ScreenHeader title="Setlists" subtitle={groupName} onBack={onBack} />

      <ListToolbar
        search={search}
        onSearchChange={(t) => { setSearch(t); setPage(1); }}
        searchPlaceholder="Buscar setlist..."
        onCreate={canCreate ? () => { setEditingSetlist(null); setModalVisible(true); } : undefined}
        createLabel="+ Nuevo setlist"
      />

      {loading && setlists.length === 0 ? (
        <ActivityIndicator color={c.primary} style={s.loader} />
      ) : (
        <FlatList
          data={setlists}
          keyExtractor={(item) => item.id}
          renderItem={renderSetlist}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSetlists(); }} />}
          ListEmptyComponent={<EmptyState message="Este grupo aún no tiene setlists" icon="list-outline" />}
          scrollEnabled={false}
        />
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <SetlistFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialSetlist={editingSetlist}
        title={editingSetlist ? `Editar: ${editingSetlist.name}` : 'Nuevo setlist'}
        submitLabel={editingSetlist ? 'Guardar cambios' : 'Crear setlist'}
      />
    </ScrollView>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { padding: 24, paddingTop: 16 },
    loader: { marginTop: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    cardBody: { flex: 1, flexDirection: 'row' },
    cardContent: { flex: 1 },
    setName: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    setDescription: { color: c.textSecondary, fontSize: 13, marginBottom: 8 },
    meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    chip: { backgroundColor: c.surface2, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 },
    chipText: { color: c.textSecondary, fontSize: 11, fontWeight: '600' },
  });