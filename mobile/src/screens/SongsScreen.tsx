// ============================================================
// SONGS SCREEN — lista de canciones de un grupo
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as SongsService from '../services/songs.service';
import type { Song } from '../services/songs.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showSuccess } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import ListToolbar from '../components/ListToolbar';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import RowActions from '../components/RowActions';
import SongFormModal from '../components/SongFormModal';

interface Props {
  groupId: string;
  groupName: string;
  myRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
  onOpenSong: (songId: string) => void;
}

export default function SongsScreen({
  groupId,
  groupName,
  myRole,
  onBack,
  onOpenSong,
}: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Doble capa: permiso global + rol contextual
  const canCreate = can('songs.create') && (myRole === 'owner' || myRole === 'admin');
  const canEdit = can('songs.edit') && (myRole === 'owner' || myRole === 'admin');
  const canDelete = can('songs.delete') && (myRole === 'owner' || myRole === 'admin');

  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SongsService.listSongs(groupId, {
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setSongs(res.data);
      setTotalPages(res.meta.totalPages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, page, search]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  function onRefresh() {
    setRefreshing(true);
    loadSongs();
  }

  function handleSearch(text: string) {
    setSearch(text);
    setPage(1);
  }

  function openCreate() {
    setEditingSong(null);
    setModalVisible(true);
  }

  function openEdit(song: Song) {
    setEditingSong(song);
    setModalVisible(true);
  }

  function handleDelete(song: Song) {
    confirmAction(
      'Eliminar canción',
      `¿Eliminar "${song.title}"?`,
      async () => {
        await SongsService.deleteSong(song.id);
        showSuccess('Éxito', 'Canción eliminada');
        loadSongs();
      },
    );
  }

  async function handleModalSubmit(payload: any) {
    if (editingSong) {
      await SongsService.updateSong(editingSong.id, payload);
      showSuccess('Éxito', 'Canción actualizada');
    } else {
      await SongsService.createSong(groupId, payload);
      showSuccess('Éxito', 'Canción creada');
    }
    await loadSongs();
  }

function renderSong({ item }: { item: Song }) {
    return (
      <View style={s.card}>
        <TouchableOpacity
          style={s.cardBody}
          onPress={() => onOpenSong(item.id)}
          activeOpacity={0.7}
        >
          <View style={s.cardContent}>
            <Text style={s.songTitle}>{item.title}</Text>
            {item.artist && (
              <Text style={s.songArtist} numberOfLines={1}>{item.artist}</Text>
            )}
            <View style={s.meta}>
              {item.songKey && (
                <View style={s.chip}>
                  <Text style={s.chipText}>🎵 {item.songKey}</Text>
                </View>
              )}
              {item.bpm && (
                <View style={s.chip}>
                  <Text style={s.chipText}>⏱ {item.bpm} BPM</Text>
                </View>
              )}
              {item.genre && (
                <View style={s.chip}>
                  <Text style={s.chipText}>{item.genre}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <RowActions
          onEdit={() => openEdit(item)}
          onDelete={() => handleDelete(item)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={s.scroll}>
      <ScreenHeader
        title={`Canciones`}
        subtitle={groupName}
        onBack={onBack}
      />

      <ListToolbar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Buscar por título, artista, género..."
        onCreate={canCreate ? openCreate : undefined}
        createLabel="+ Nueva canción"
      />

      {loading && songs.length === 0 ? (
        <ActivityIndicator color={c.primary} style={s.loader} />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              message="Este grupo aún no tiene canciones"
              icon="musical-notes-outline"
            />
          }
          scrollEnabled={false}
        />
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <SongFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialSong={editingSong}
        title={editingSong ? `Editar: ${editingSong.title}` : 'Nueva canción'}
        submitLabel={editingSong ? 'Guardar cambios' : 'Crear canción'}
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
    songTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    songArtist: { color: c.textSecondary, fontSize: 13, marginBottom: 8 },
    meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    chip: {
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    chipText: { color: c.textSecondary, fontSize: 11, fontWeight: '600' },
  });