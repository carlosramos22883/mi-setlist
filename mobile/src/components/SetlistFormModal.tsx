// ============================================================
// SETLIST FORM MODAL — crear/editar setlist
// ============================================================
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import FormModal from './FormModal';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { showAlert } from '../utils/dialogs';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>;
  initialSetlist?: any | null;
  title: string;
  submitLabel: string;
}

export default function SetlistFormModal({
  visible,
  onClose,
  onSubmit,
  initialSetlist,
  title,
  submitLabel,
}: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialSetlist?.name ?? '');
      setDescription(initialSetlist?.description ?? '');
      setError('');
    }
  }, [visible, initialSetlist]);

  async function handleSave() {
    setError('');
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar');
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
      <Text style={s.label}>Nombre *</Text>
      <TextInput
        style={[s.input, error !== '' && s.inputError]}
        placeholder="Ej: Ensayo Viernes, Boda de Ana..."
        placeholderTextColor={c.textMuted}
        value={name}
        onChangeText={(t) => { setName(t); setError(''); }}
      />
      {error !== '' && <Text style={s.error}>{error}</Text>}

      <Text style={s.label}>Descripción (opcional)</Text>
      <TextInput
        style={[s.input, s.descriptionInput]}
        placeholder="Notas del repertorio..."
        placeholderTextColor={c.textMuted}
        multiline
        value={description}
        onChangeText={setDescription}
      />
    </FormModal>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
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
    descriptionInput: { minHeight: 70, textAlignVertical: 'top' },
    inputError: { borderColor: '#F87171' },
    error: { color: '#F87171', fontSize: 12, marginBottom: 8, marginTop: -6 },
  });