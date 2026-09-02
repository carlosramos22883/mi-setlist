// ============================================================
// EVENT FORM MODAL — crear/editar evento (fecha y hora amigables)
// ============================================================
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import FormModal from './FormModal';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';

const pad = (n: number) => String(n).padStart(2, '0');

// Date → "20/09/2026"
function toDateInput(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
// Date → "18:00"
function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// "20/09/2026" + "18:00" → Date | null
function parseDateTime(dateStr: string, timeStr: string): Date | null {
  const dm = dateStr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const tm = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const d = new Date(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1]), Number(tm[1]), Number(tm[2]));
  return isNaN(d.getTime()) ? null : d;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    location?: string;
    address?: string;
    startsAt: string;
  }) => Promise<void>;
  initialEvent?: any | null;
  title: string;
  submitLabel: string;
}

export default function EventFormModal({
  visible, onClose, onSubmit, initialEvent, title, submitLabel,
}: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);

  const [formData, setFormData] = useState({
    title: '', description: '', location: '', address: '', date: '', time: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const d = initialEvent?.startsAt ? new Date(initialEvent.startsAt) : null;
      setFormData({
        title: initialEvent?.title ?? '',
        description: initialEvent?.description ?? '',
        location: initialEvent?.location ?? '',
        address: initialEvent?.address ?? '',
        date: d ? toDateInput(d) : '',
        time: d ? toTimeInput(d) : '',
      });
      setErrors({});
    }
  }, [visible, initialEvent]);

  function update<K extends keyof typeof formData>(key: K, value: string) {
    setFormData((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'El título es obligatorio';
    const starts = parseDateTime(formData.date, formData.time);
    if (!starts) errs.date = 'Usa DD/MM/AAAA y HH:mm válidos';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        address: formData.address.trim() || undefined,
        startsAt: (starts as Date).toISOString(),
      });
      onClose();
    } catch (e: any) {
      setErrors({ title: e?.response?.data?.message ?? 'No se pudo guardar' });
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
      <ScrollView style={{ maxHeight: 420 }}>
        <Text style={s.label}>Título *</Text>
        <TextInput
          style={[s.input, errors.title && s.inputError]}
          placeholder="Ej: Concierto de Primavera"
          placeholderTextColor={c.textMuted}
          value={formData.title}
          onChangeText={(t) => update('title', t)}
        />

        <Text style={s.label}>Descripción (opcional)</Text>
        <TextInput
          style={[s.input, s.area]}
          placeholder="Notas del evento..."
          placeholderTextColor={c.textMuted}
          multiline
          value={formData.description}
          onChangeText={(t) => update('description', t)}
        />

        <Text style={s.label}>Lugar (nombre)</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Teatro Municipal"
          placeholderTextColor={c.textMuted}
          value={formData.location}
          onChangeText={(t) => update('location', t)}
        />

        <Text style={s.label}>Dirección</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Av. Principal 123, Ciudad"
          placeholderTextColor={c.textMuted}
          value={formData.address}
          onChangeText={(t) => update('address', t)}
        />

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Fecha *</Text>
            <TextInput
              style={[s.input, errors.date && s.inputError]}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={c.textMuted}
              value={formData.date}
              onChangeText={(t) => update('date', t)}
            />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Hora *</Text>
            <TextInput
              style={[s.input, errors.date && s.inputError]}
              placeholder="HH:mm"
              placeholderTextColor={c.textMuted}
              value={formData.time}
              onChangeText={(t) => update('time', t)}
            />
          </View>
        </View>
        {errors.date !== '' && <Text style={s.error}>{errors.date}</Text>}
      </ScrollView>
    </FormModal>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    label: {
      color: c.textSecondary, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', marginBottom: 6,
    },
    input: {
      backgroundColor: c.surface2, borderRadius: 12, paddingHorizontal: 14,
      paddingVertical: 12, color: c.text, marginBottom: 12,
      borderWidth: 1, borderColor: c.border,
    },
    area: { minHeight: 70, textAlignVertical: 'top' },
    inputError: { borderColor: '#F87171' },
    error: { color: '#F87171', fontSize: 12, marginBottom: 8, marginTop: -6 },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
  });