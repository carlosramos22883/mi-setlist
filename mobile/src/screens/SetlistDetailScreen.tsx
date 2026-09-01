// ============================================================
// SETLIST DETAIL SCREEN — canciones ordenadas + gestión completa
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as SetlistsService from '../services/setlists.service';
import type { SetlistDetail, SetlistSong } from '../services/setlists.service';
import * as SongsService from '../services/songs.service';
import type { Song } from '../services/songs.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showSuccess } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import FormModal from '../components/FormModal';
import SetlistFormModal from '../components/SetlistFormModal';

interface Props {
  setlistId: string;
  groupId: string;
  groupName: string;
  myRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
}

export default function SetlistDetailScreen({
  setlistId, groupId, groupName, myRole, onBack,
}: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [setlist, setSetlist] = useState<SetlistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [songLinkModal, setSongLinkModal] = useState<SetlistSong | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [linkNotes, setLinkNotes] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Doble capa
  const canManage = can('setlists.edit') && (myRole === 'owner' || myRole === 'admin');
  const canDeleteSetlist = can('setlists.delete') && (myRole === 'owner' || myRole === 'admin');

  const loadSetlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SetlistsService.getSetlist(setlistId);
      setSetlist(data);
    } finally {
      setLoading(false);
    }
  }, [setlistId]);

  useEffect(() => { loadSetlist(); }, [loadSetlist]);

  // Duración estimada total
  const totalSeconds = (setlist?.songs ?? []).reduce(
    (acc, l) => acc + (l.song.durationSeconds ?? 0), 0,
  );
  const totalLabel = totalSeconds > 0
    ? `${Math.floor(totalSeconds / 60)} min ${totalSeconds % 60} s`
    : null;

  // ---------------------------------------------------------
  // REORDENAR: subir/bajar una canción
  // ---------------------------------------------------------
  async function move(item: SetlistSong, direction: -1 | 1) {
    if (!setlist) return;
    const sorted = [...setlist.songs].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((x) => x.id === item.id);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;

    const newOrder = [...sorted];
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];

    const payload = newOrder.map((l, i) => ({ songId: l.songId, position: i + 1 }));
    await SetlistsService.reorderSetlist(setlist.id, payload);
    await loadSetlist();
  }

  // ---------------------------------------------------------
  // AGREGAR canción desde el repertorio del grupo
  // ---------------------------------------------------------
  async function openAddModal() {
    setAddModalVisible(true);
    setLoadingAvailable(true);
    try {
      const res = await SongsService.listSongs(groupId, { limit: 50 });
      const inSetlist = new Set((setlist?.songs ?? []).map((l) => l.songId));
      setAvailableSongs(res.data.filter((song) => !inSetlist.has(song.id)));
    } finally {
      setLoadingAvailable(false);
    }
  }

  async function handleAdd(song: Song) {
    await SetlistsService.addSongToSetlist(setlistId, { songId: song.id });
    showSuccess('Agregada', `"${song.title}" se agregó al setlist`);
    setAvailableSongs((prev) => prev.filter((x) => x.id !== song.id));
    await loadSetlist();
  }

  // ---------------------------------------------------------
  // EDITAR tonalidad/notas específicas del setlist
  // ---------------------------------------------------------
  function openEditLink(link: SetlistSong) {
    setSongLinkModal(link);
    setCustomKey(link.customKey ?? '');
    setLinkNotes(link.notes ?? '');
  }

  async function handleSaveLink() {
    if (!songLinkModal) return;
    setSavingLink(true);
    try {
      await SetlistsService.updateSetlistSong(setlistId, songLinkModal.songId, {
        customKey: customKey.trim() || undefined,
        notes: linkNotes.trim() || undefined,
      });
      showSuccess('Éxito', 'Cambios guardados');
      setSongLinkModal(null);
      await loadSetlist();
    } finally {
      setSavingLink(false);
    }
  }

  // ---------------------------------------------------------
  // QUITAR canción del setlist
  // ---------------------------------------------------------
  function handleRemove(link: SetlistSong) {
    confirmAction(
      'Quitar canción',
      `¿Quitar "${link.song.title}" del setlist? (La canción NO se elimina del repertorio)`,
      async () => {
        await SetlistsService.removeSongFromSetlist(setlistId, link.songId);
        showSuccess('Éxito', 'Canción quitada del setlist');
        await loadSetlist();
      },
    );
  }

  function handleDeleteSetlist() {
    if (!setlist) return;
    confirmAction(
      'Eliminar setlist',
      `¿Eliminar "${setlist.name}"?`,
      async () => {
        await SetlistsService.deleteSetlist(setlistId);
        showSuccess('Éxito', 'Setlist eliminado');
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

  if (!setlist) {
    return (
      <View style={[globalStyles.screen, s.loadingWrap]}>
        <Text style={s.empty}>Setlist no encontrado</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={globalStyles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedSongs = [...setlist.songs].sort((a, b) => a.position - b.position);

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={s.scroll}>
        <ScreenHeader title={setlist.name} subtitle={groupName} onBack={onBack} />

        {/* Resumen */}
        <View style={s.card}>
          {setlist.description && (
            <Text style={s.description}>{setlist.description}</Text>
          )}
          <View style={s.chipsRow}>
            <View style={s.chip}>
              <Text style={s.chipText}>🎵 {sortedSongs.length} canciones</Text>
            </View>
            {totalLabel && (
              <View style={s.chip}>
                <Text style={s.chipText}>⏰ {totalLabel}</Text>
              </View>
            )}
          </View>

          {canManage && (
            <View style={s.actionsRow}>
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => setEditModalVisible(true)}
              >
                <Text style={globalStyles.buttonText}>✏️ Editar</Text>
              </TouchableOpacity>
              {canDeleteSetlist && (
                <TouchableOpacity
                  style={[globalStyles.buttonDanger, s.dangerBtn]}
                  onPress={handleDeleteSetlist}
                >
                  <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Agregar canción */}
        {canManage && (
          <TouchableOpacity
            style={[globalStyles.button, s.addBtn]}
            onPress={openAddModal}
          >
            <Text style={globalStyles.buttonText}>+ Agregar canción</Text>
          </TouchableOpacity>
        )}

        {/* Lista ordenada */}
        <Text style={s.sectionTitle}>Orden del repertorio</Text>
        {sortedSongs.length === 0 ? (
          <Text style={s.emptySongs}>Aún no hay canciones en este setlist</Text>
        ) : (
          sortedSongs.map((link, index) => (
            <View key={link.id} style={s.songRow}>
              <View style={s.positionBadge}>
                <Text style={s.positionText}>{index + 1}</Text>
              </View>

              <View style={s.songInfo}>
                <Text style={s.songTitle}>{link.song.title}</Text>
                {link.song.artist && (
                  <Text style={s.songArtist}>{link.song.artist}</Text>
                )}
                <View style={s.chipsRow}>
                  <View style={s.chip}>
                    <Text style={s.chipText}>
                      🎵 {link.customKey ?? link.song.songKey ?? '—'}
                    </Text>
                  </View>
                  {link.notes && (
                    <View style={s.chip}>
                      <Text style={s.chipText} numberOfLines={1}>📝 {link.notes}</Text>
                    </View>
                  )}
                </View>
              </View>

              {canManage && (
                <View style={s.rowActions}>
                  <TouchableOpacity
                    style={[s.iconBtn, index === 0 && s.iconDisabled]}
                    onPress={() => move(link, -1)}
                    disabled={index === 0}
                  >
                    <Ionicons name="chevron-up" size={16} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.iconBtn, index === sortedSongs.length - 1 && s.iconDisabled]}
                    onPress={() => move(link, 1)}
                    disabled={index === sortedSongs.length - 1}
                  >
                    <Ionicons name="chevron-down" size={16} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => openEditLink(link)}>
                    <Ionicons name="create-outline" size={16} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.iconBtn, s.iconDanger]}
                    onPress={() => handleRemove(link)}
                  >
                    <Ionicons name="trash-outline" size={16} color={c.text} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal: editar setlist */}
      <SetlistFormModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={async (payload) => {
          await SetlistsService.updateSetlist(setlistId, payload);
          showSuccess('Éxito', 'Setlist actualizado');
          await loadSetlist();
        }}
        initialSetlist={setlist}
        title={`Editar: ${setlist.name}`}
        submitLabel="Guardar cambios"
      />

      {/* Modal: agregar canción */}
      <Modal visible={addModalVisible} transparent animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Agregar canción</Text>
            <Text style={s.modalSubtitle}>
              Canciones del repertorio que aún no están en este setlist
            </Text>
            {loadingAvailable ? (
              <ActivityIndicator color={c.primary} style={{ marginVertical: 24 }} />
            ) : availableSongs.length === 0 ? (
              <Text style={s.emptySongs}>No hay más canciones disponibles</Text>
            ) : (
              <FlatList
                data={availableSongs}
                keyExtractor={(item) => item.id}
                style={s.availableList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.availableRow}
                    onPress={() => handleAdd(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.songTitle}>{item.title}</Text>
                      {item.artist && <Text style={s.songArtist}>{item.artist}</Text>}
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={c.primary} />
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[globalStyles.button, { marginTop: 12 }]}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={globalStyles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: tonalidad/notas específicas */}
      <FormModal
        visible={songLinkModal !== null}
        onClose={() => setSongLinkModal(null)}
        title={songLinkModal ? `🎵 ${songLinkModal.song.title}` : ''}
        submitLabel="Guardar"
        onSubmit={handleSaveLink}
        loading={savingLink}
      >
        <Text style={s.label}>Tonalidad para este setlist</Text>
        <TextInput
          style={s.input}
          placeholder="Dejar vacío para usar la original"
          placeholderTextColor={c.textMuted}
          value={customKey}
          onChangeText={setCustomKey}
        />
        <Text style={s.label}>Notas para este setlist</Text>
        <TextInput
          style={[s.input, s.notesInput]}
          placeholder="Ej: bajar energía, entrar a capela..."
          placeholderTextColor={c.textMuted}
          multiline
          value={linkNotes}
          onChangeText={setLinkNotes}
        />
      </FormModal>
    </View>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    loadingWrap: { alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 24, paddingTop: 16 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    description: { color: c.textSecondary, fontSize: 14, marginBottom: 12 },
    chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { backgroundColor: c.surface2, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    dangerBtn: { flex: 1 },
    addBtn: { marginBottom: 20 },
    sectionTitle: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    emptySongs: { color: c.textMuted, textAlign: 'center', paddingVertical: 24, fontStyle: 'italic' },
    songRow: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    positionBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    positionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    songInfo: { flex: 1 },
    songTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
    songArtist: { color: c.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 6 },
    rowActions: { flexDirection: 'row', gap: 6 },
    iconBtn: {
      backgroundColor: c.surface2,
      borderRadius: 8,
      padding: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    iconDisabled: { opacity: 0.35 },
    iconDanger: { backgroundColor: 'rgba(220, 53, 69, 0.15)' },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
    modalSubtitle: { color: c.textMuted, fontSize: 12, marginTop: 4, marginBottom: 12 },
    availableList: { maxHeight: 320 },
    availableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    input: {
      backgroundColor: c.surface2,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    notesInput: { minHeight: 70, textAlignVertical: 'top' },
  });