// ============================================================
// SONG FORM MODAL — crear/editar canción
// ============================================================
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import FormModal from './FormModal';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { showAlert } from '../utils/dialogs';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    artist?: string;
    author?: string;
    lyrics?: string;
    songKey?: string;
    bpm?: number;
    durationSeconds?: number;
    language?: string;
    genre?: string;
  }) => Promise<void>;
  initialSong?: any | null;
  title: string;
  submitLabel: string;
}

export default function SongFormModal({
  visible,
  onClose,
  onSubmit,
  initialSong,
  title,
  submitLabel,
}: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    author: '',
    lyrics: '',
    songKey: '',
    bpm: '',
    durationSeconds: '',
    language: '',
    genre: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setFormData({
        title: initialSong?.title ?? '',
        artist: initialSong?.artist ?? '',
        author: initialSong?.author ?? '',
        lyrics: initialSong?.lyrics ?? '',
        songKey: initialSong?.songKey ?? '',
        bpm: initialSong?.bpm?.toString() ?? '',
        durationSeconds: initialSong?.durationSeconds?.toString() ?? '',
        language: initialSong?.language ?? '',
        genre: initialSong?.genre ?? '',
      });
      setErrors({});
    }
  }, [visible, initialSong]);

  function update<K extends keyof typeof formData>(key: K, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  async function handleSave() {
    setErrors({});
    if (!formData.title.trim()) {
      setErrors({ title: 'El título es obligatorio' });
      return;
    }

    setSaving(true);
    try {
      const payload: any = { title: formData.title.trim() };
      if (formData.artist.trim()) payload.artist = formData.artist.trim();
      if (formData.author.trim()) payload.author = formData.author.trim();
      if (formData.lyrics.trim()) payload.lyrics = formData.lyrics.trim();
      if (formData.songKey.trim()) payload.songKey = formData.songKey.trim();
      if (formData.bpm.trim()) payload.bpm = Number(formData.bpm);
      if (formData.durationSeconds.trim())
        payload.durationSeconds = Number(formData.durationSeconds);
      if (formData.language.trim()) payload.language = formData.language.trim();
      if (formData.genre.trim()) payload.genre = formData.genre.trim();

      await onSubmit(payload);
      onClose();
    } catch (e: any) {
      const data = e?.response?.data ?? e;
      if (data?.fields) setErrors(data.fields);
      else showAlert('Error', data?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={title}
      submitLabel={submitLabel}
      onSubmit={handleSave}
      loading={saving}
    >
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <Text style={s.label}>Título *</Text>
        <TextInput
          style={[s.input, errors.title && s.inputError]}
          placeholder="Ej: Bohemian Rhapsody"
          placeholderTextColor={c.textMuted}
          value={formData.title}
          onChangeText={(t) => update('title', t)}
        />
        {errors.title && <Text style={s.error}>{errors.title}</Text>}

        <Text style={s.label}>Artista / Banda</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Queen"
          placeholderTextColor={c.textMuted}
          value={formData.artist}
          onChangeText={(t) => update('artist', t)}
        />

        <Text style={s.label}>Autor / Compositor</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Freddie Mercury"
          placeholderTextColor={c.textMuted}
          value={formData.author}
          onChangeText={(t) => update('author', t)}
        />

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Tonalidad</Text>
            <TextInput
              style={s.input}
              placeholder="G, Am, C..."
              placeholderTextColor={c.textMuted}
              value={formData.songKey}
              onChangeText={(t) => update('songKey', t)}
            />
          </View>
          <View style={s.half}>
            <Text style={s.label}>BPM</Text>
            <TextInput
              style={s.input}
              placeholder="72"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={formData.bpm}
              onChangeText={(t) => update('bpm', t)}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Duración (seg)</Text>
            <TextInput
              style={s.input}
              placeholder="354"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={formData.durationSeconds}
              onChangeText={(t) => update('durationSeconds', t)}
            />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Idioma</Text>
            <TextInput
              style={s.input}
              placeholder="Español"
              placeholderTextColor={c.textMuted}
              value={formData.language}
              onChangeText={(t) => update('language', t)}
            />
          </View>
        </View>

        <Text style={s.label}>Género</Text>
        <TextInput
          style={s.input}
          placeholder="Rock, Pop, Gospel..."
          placeholderTextColor={c.textMuted}
          value={formData.genre}
          onChangeText={(t) => update('genre', t)}
        />

        <Text style={s.label}>Letra</Text>
        <TextInput
          style={[s.input, s.lyricsInput]}
          placeholder="Pega aquí la letra de la canción..."
          placeholderTextColor={c.textMuted}
          multiline
          textAlignVertical="top"
          value={formData.lyrics}
          onChangeText={(t) => update('lyrics', t)}
        />
        <Text style={s.hint}>
          💡 Escribe los acordes entre [corchetes] justo antes de cada sílaba:{'\n'}
          [D]Esta es la letra... [A]lala lara... [Bm]es bien bonita...
        </Text>
      </ScrollView>
    </FormModal>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { maxHeight: 420 },
    scrollContent: { paddingBottom: 12 },
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
    lyricsInput: { minHeight: 140 },
    inputError: { borderColor: '#F87171' },
    error: { color: '#F87171', fontSize: 12, marginBottom: 8, marginTop: -6 },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    hint: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: -6,
      marginBottom: 12,
    },
  });