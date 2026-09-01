// ============================================================
// SONG DETAIL SCREEN — letra, metadatos, editar inline y eliminar
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList, 
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as CategoriesService from '../services/categories.service';
import type { SongCategory } from '../services/categories.service';
import { useAuth } from '../context/AuthContext';
import * as SongsService from '../services/songs.service';
import type { Song } from '../services/songs.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showSuccess } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import SongFormModal from '../components/SongFormModal';
import ChordLyrics from '../components/ChordLyrics';

interface Props {
  songId: string;
  groupId: string;
  groupName: string;
  myRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
}

export default function SongDetailScreen({
  songId,
  groupId,
  groupName,
  myRole,
  onBack,
}: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showChords, setShowChords] = useState(true);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [groupCategories, setGroupCategories] = useState<SongCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [hasNote, setHasNote] = useState(false);

  // Categorías: gestionar = songs.edit contextual; crear = categories.create
  const canManageCats = can('songs.edit') && (myRole === 'owner' || myRole === 'admin');
  const canCreateCat = can('categories.create') && (myRole === 'owner' || myRole === 'admin');

  // Doble capa
  const canEdit = can('songs.edit') && (myRole === 'owner' || myRole === 'admin');
  const canDelete = can('songs.delete') && (myRole === 'owner' || myRole === 'admin');

  const loadSong = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SongsService.getSong(songId);
      setSong(data);
      setIsFavorite(!!data.isFavorite);
      setFavoriteCount(data.favoriteCount ?? 0);
      setCategories(data.categories ?? []);

      const note = await SongsService.getMyNote(songId);
      setNoteDraft(note?.content ?? '');
      setHasNote(!!note);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    loadSong();
  }, [loadSong]);

  function handleDelete() {
    if (!song) return;
    confirmAction(
      'Eliminar canción',
      `¿Eliminar "${song.title}"? Esta acción no se puede deshacer.`,
      async () => {
        await SongsService.deleteSong(song.id);
        showSuccess('Éxito', 'Canción eliminada');
        onBack();
      },
    );
  }

  async function handleEditSubmit(payload: any) {
    if (!song) return;
    await SongsService.updateSong(song.id, payload);
    showSuccess('Éxito', 'Canción actualizada');
    await loadSong(); // recarga los datos
  }

    async function toggleFavorite() {
    if (!song) return;
    if (isFavorite) {
      await SongsService.removeFavorite(song.id);
      setIsFavorite(false);
      setFavoriteCount((n) => Math.max(0, n - 1));
    } else {
      await SongsService.addFavorite(song.id);
      setIsFavorite(true);
      setFavoriteCount((n) => n + 1);
    }
  }

  async function handleSaveNote() {
    if (!song || noteDraft.trim() === '') return;
    setSavingNote(true);
    try {
      await SongsService.upsertMyNote(song.id, noteDraft.trim());
      setHasNote(true);
      showSuccess('Éxito', 'Nota guardada');
    } finally {
      setSavingNote(false);
    }
  }

  // 🆕 Eliminar la nota (y limpiar el campo)
  async function handleDeleteNote() {
    if (!song) return;
    setSavingNote(true);
    try {
      await SongsService.deleteMyNote(song.id);
      setNoteDraft('');
      setHasNote(false);
      showSuccess('Éxito', 'Nota eliminada');
    } finally {
      setSavingNote(false);
    }
  }

  async function openCatModal() {
    setCatModalVisible(true);
    const all = await CategoriesService.listCategories(groupId);
    setGroupCategories(all);
  }

  async function handleAddCat(cat: SongCategory) {
    if (!song) return;
    await CategoriesService.addCategoryToSong(song.id, cat.id);
    setCategories((prev) => [...prev, cat]);
  }

  async function handleRemoveCat(cat: SongCategory) {
    if (!song) return;
    await CategoriesService.removeCategoryFromSong(song.id, cat.id);
    setCategories((prev) => prev.filter((x) => x.id !== cat.id));
  }

  async function handleCreateCat() {
    const cat = await CategoriesService.createCategory(groupId, { name: newCatName.trim() });
    setGroupCategories((prev) => [...prev, cat]);
    setNewCatName('');
    await handleAddCat(cat); // la crea y la agrega de una
  }

  if (loading) {
    return (
      <View style={[globalStyles.screen, s.loadingWrap]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!song) {
    return (
      <View style={[globalStyles.screen, s.loadingWrap]}>
        <Text style={s.empty}>Canción no encontrada</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={globalStyles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 354 → "5:54"
  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ISO → "31 ago 2026"
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } 

  // Fila que SOLO se pinta si hay valor
  function InfoRow({
    label,
    value,
    small,
  }: {
    label: string;
    value?: string | null;
    small?: boolean;
  }) {
    if (!value) return null;
    return (
      <View style={s.row}>
        <Text style={small ? s.smallLabel : s.label}>{label}</Text>
        <Text style={small ? s.smallValue : s.value}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={s.scroll}>
        <ScreenHeader title={song.title} subtitle={groupName} onBack={onBack} />

        {/* Metadatos */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.sectionTitle}>Información</Text>
            <TouchableOpacity style={s.favBtn} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : c.textMuted}
              />
              <Text style={s.favCount}>{favoriteCount}</Text>
            </TouchableOpacity>
          </View>

          {/* Filas dinámicas: solo aparecen si tienen dato */}
          <InfoRow label="Artista" value={song.artist} />
          <InfoRow label="Autor / Compositor" value={song.author} />
          <InfoRow label="Idioma" value={song.language} />
          <InfoRow label="Género" value={song.genre} />

          {/* Chips musicales (también condicionales) */}
          {(song.songKey || song.bpm || song.durationSeconds) && (
            <View style={[s.chipsRow, { marginTop: 12 }]}>
              {song.songKey && (
                <View style={s.chip}>
                  <Text style={s.chipText}>🎵 {song.songKey}</Text>
                </View>
              )}
              {song.bpm && (
                <View style={s.chip}>
                  <Text style={s.chipText}>⏱ {song.bpm} BPM</Text>
                </View>
              )}
              {song.durationSeconds && (
                <View style={s.chip}>
                  <Text style={s.chipText}>⏰ {formatDuration(song.durationSeconds)}</Text>
                </View>
              )}
            </View>
          )}

          {/* 🏷️ Categorías (como ya lo tienes) */}
          <View style={[s.chipsRow, { marginTop: 12 }]}>
            {categories.map((cat) => (
              <View
                key={cat.id}
                style={[s.chip, cat.color ? { backgroundColor: cat.color + '33' } : null]}
              >
                <Text style={[s.chipText, cat.color ? { color: cat.color } : null]}>
                  🏷️ {cat.name}
                </Text>
                {canManageCats && (
                  <TouchableOpacity onPress={() => handleRemoveCat(cat)} style={{ marginLeft: 6 }}>
                    <Ionicons name="close-circle" size={14} color={cat.color ?? c.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {canManageCats && (
              <TouchableOpacity style={s.addChip} onPress={openCatModal}>
                <Text style={s.addChipText}>+ 🏷️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 🆕 Autoría y fechas (discreto, al final) */}
          <View style={s.divider} />
          <InfoRow small label="Agregada por" value={song.createdBy?.name} />
          <InfoRow small label="Creada" value={formatDate(song.createdAt)} />
          <InfoRow small label="Última actualización" value={formatDate(song.updatedAt)} />
        </View>

        {/* Letra */}
        {song.lyrics ? (
          <View style={s.card}>
            <View style={s.lyricsHeader}>
              <Text style={s.sectionTitle}>Letra y acordes</Text>
                            <TouchableOpacity
                style={s.toggleBtn}
                onPress={() => setShowChords((v) => !v)}
              >
                <Text style={s.toggleText}>
                  {showChords ? '🎸 Ocultar acordes y tabs' : '🎸 Ver acordes y tabs'}
                </Text>
              </TouchableOpacity>
            </View>
            <ChordLyrics lyrics={song.lyrics} showChords={showChords} />
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Letra y acordes</Text>
            <Text style={s.emptyLyrics}>Sin letra registrada</Text>
          </View>
        )}

        {/* 📝 Nota personal (solo tú la ves) */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>📝 Mi nota</Text>
          <Text style={s.noteHint}>Privada: solo tú puedes verla y editarla.</Text>
          <TextInput
            style={[s.input, s.noteInput]}
            placeholder="Ej: entrar a capela, bajar medio tono en el coro..."
            placeholderTextColor={c.textMuted}
            multiline
            value={noteDraft}
            onChangeText={setNoteDraft}
          />
          <View style={s.noteActions}>
            <TouchableOpacity
              style={[globalStyles.button, s.noteSaveBtn]}
              onPress={handleSaveNote}
              disabled={savingNote || noteDraft.trim() === ''}
            >
              <Text style={globalStyles.buttonText}>Guardar mi nota</Text>
            </TouchableOpacity>

            {(hasNote || noteDraft.trim() !== '') && (
              <TouchableOpacity
                style={[globalStyles.buttonDanger, s.noteDeleteBtn]}
                onPress={handleDeleteNote}
                disabled={savingNote}
              >
                <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Acciones */}
        <View style={s.actionsRow}>
          {canEdit && (
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

      {/* Modal de edición inline */}
      <SongFormModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        initialSong={song}
        title={`Editar: ${song.title}`}
        submitLabel="Guardar cambios"
      />

      {/* 🏷️ Modal: agregar/crear categorías */}
      <Modal
        visible={catModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Agregar categoría</Text>

            {canCreateCat && (
              <View style={s.newCatRow}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Nueva categoría..."
                  placeholderTextColor={c.textMuted}
                  value={newCatName}
                  onChangeText={setNewCatName}
                />
                <TouchableOpacity
                  style={[globalStyles.button, s.newCatBtn]}
                  onPress={handleCreateCat}
                  disabled={newCatName.trim() === ''}
                >
                  <Text style={globalStyles.buttonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={groupCategories.filter((gc) => !categories.some((x) => x.id === gc.id))}
              keyExtractor={(item) => item.id}
              style={s.catList}
              ListEmptyComponent={
                <Text style={s.emptyCats}>No hay más categorías disponibles</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={s.catRow} onPress={() => handleAddCat(item)}>
                  <Text style={s.catName}>🏷️ {item.name}</Text>
                  <Ionicons name="add-circle-outline" size={22} color={c.primary} />
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[globalStyles.button, { marginTop: 12 }]}
              onPress={() => setCatModalVisible(false)}
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
    emptyLyrics: {
      color: c.textMuted,
      fontSize: 14,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 20,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    value: { color: c.text, fontSize: 14, fontWeight: '700' },
    chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 },
    chip: {
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    sectionTitle: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    halfBtn: { flex: 1, paddingVertical: 12 }, // 🆕 mitades iguales + compacto
    toggleBtn: {
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    toggleText: { color: c.accent, fontSize: 12, fontWeight: '700' },
        cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    favBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
    favCount: { color: c.textSecondary, fontSize: 13, fontWeight: '700' },
    addChip: {
      borderRadius: 9999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
    },
    addChipText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    noteHint: { color: c.textMuted, fontSize: 12, marginBottom: 10 },
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
    noteInput: { minHeight: 80, textAlignVertical: 'top' },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: { backgroundColor: c.surface, borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
    newCatRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
    newCatBtn: { flex: 0, paddingHorizontal: 20, paddingVertical: 12 },
    catList: { maxHeight: 280 },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    catName: { color: c.text, fontSize: 14, fontWeight: '600' },
    emptyCats: { color: c.textMuted, textAlign: 'center', paddingVertical: 16, fontStyle: 'italic' },
    noteActions: { flexDirection: 'row', gap: 12 },
    noteSaveBtn: { flex: 1, paddingVertical: 12 },
    noteDeleteBtn: { flex: 1, paddingVertical: 12 },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 12,
    },
    smallLabel: { color: c.textMuted, fontSize: 12 },
    smallValue: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
        lyricsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
  });