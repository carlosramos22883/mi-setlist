// ============================================================
// GROUP FORM MODAL — crear/editar grupo con logo recortable
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as GroupsService from '../services/groups.service';
import type { Group } from '../services/groups.service';
import FormModal from './FormModal';
import ImageCropModal from './ImageCropModal';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { API_URL } from '../constants/config';
import { showAlert } from '../utils/dialogs';
import { validatePickedImage } from '../utils/imageValidation';


const GROUP_TYPES = [
  { value: 'band', label: '🎸 Banda' },
  { value: 'choir', label: '🎤 Coro' },
  { value: 'orchestra', label: '🎻 Orquesta' },
  { value: 'vocal_group', label: '🎶 Grupo vocal' },
  { value: 'other', label: '🎵 Otro' },
] as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialGroup?: Group | null;
}

export default function GroupFormModal({ visible, onClose, onSaved, initialGroup }: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Group['type']>('band');
  const [logoLocalUri, setLogoLocalUri] = useState<string | null>(null);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialGroup?.name ?? '');
      setDescription(initialGroup?.description ?? '');
      setType(initialGroup?.type ?? 'band');
      setLogoLocalUri(null);
      setPendingCropUri(null);
      setError('');
    }
  }, [visible, initialGroup]);

  // Logo a mostrar: el recién elegido > el existente del grupo
  const currentLogoUrl = initialGroup?.logoPath
    ? `${API_URL}/${initialGroup.logoPath}`
    : null;
  const previewUri = logoLocalUri ?? currentLogoUrl;

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a tus fotos para el logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web', // nativo recorta con el SO
      aspect: Platform.OS !== 'web' ? [1, 1] : undefined,
      quality: 0.9,
    });
    
    
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    // 🆕 validación de formato y tamaño (antes de recortar)
    const validation = await validatePickedImage(asset);
    if (!validation.ok) {
      showAlert('Archivo no válido', validation.message ?? 'Selecciona otra imagen.');
      return;
    }

    if (Platform.OS === 'web') setPendingCropUri(asset.uri);
    else setLogoLocalUri(asset.uri);
  }

  async function handleSave() {
    setError('');
    if (name.trim() === '') {
      setError('El nombre del grupo es obligatorio');
      return;
    }
    setSaving(true);
    try {
      let logoPath = initialGroup?.logoPath ?? undefined;
      if (logoLocalUri) logoPath = await GroupsService.uploadLogo(logoLocalUri);

      if (initialGroup) {
        await GroupsService.updateGroup(initialGroup.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          logoPath,
        });
        showAlert('Éxito', 'Grupo actualizado');
      } else {
        await GroupsService.createGroup({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          logoPath,
        });
        showAlert('¡Grupo creado!', `"${name}" ya está listo. Eres el dueño.`);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar el grupo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <FormModal
        visible={visible}
        onClose={onClose}
        title={initialGroup ? `Editar: ${initialGroup.name}` : 'Nuevo grupo'}
        submitLabel={initialGroup ? 'Guardar cambios' : 'Crear grupo'}
        onSubmit={handleSave}
        loading={saving}
      >
        {/* Logo actual + botón de cámara (como en Mis Gastos) */}
        <View style={s.logoSection}>
          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={s.logoImage} />
              ) : (
                <View style={s.logoPlaceholder}>
                  <Text style={s.logoPlaceholderText}>🎵</Text>
                  <Text style={s.logoPlaceholderLabel}>Sin logo</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={s.cameraBtn} onPress={pickLogo}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={s.logoHint}>Toca la cámara para cambiar el logo</Text>
        </View>

        <Text style={s.label}>Nombre</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Los Rockeros"
          placeholderTextColor={c.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={s.label}>Descripción (opcional)</Text>
        <TextInput
          style={[s.input, s.descriptionInput]}
          placeholder="Breve descripción..."
          placeholderTextColor={c.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={s.label}>Tipo de grupo</Text>
        <View style={s.typeGrid}>
          {GROUP_TYPES.map((t) => {
            const selected = t.value === type;
            return (
              <TouchableOpacity
                key={t.value}
                style={[s.typeChip, selected && s.typeChipSelected]}
                onPress={() => setType(t.value)}
              >
                <Text style={[s.typeChipText, selected && s.typeChipTextSelected]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error !== '' && <Text style={s.error}>{error}</Text>}
      </FormModal>

      {/* Cropper interactivo: solo existe en web */}
      <ImageCropModal
        visible={pendingCropUri !== null}
        imageUri={pendingCropUri}
        onDone={(dataUrl) => {
          setLogoLocalUri(dataUrl);
          setPendingCropUri(null);
        }}
        onCancel={() => setPendingCropUri(null)}
      />
    </>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    logoSection: { alignItems: 'center', marginBottom: 16 },
    logoWrap: { width: 120, height: 120 },
    logoBox: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.border,
    },
    logoImage: { width: '100%', height: '100%' },
    logoPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoPlaceholderText: { fontSize: 36 },
    logoPlaceholderLabel: { color: c.textSecondary, fontSize: 12, marginTop: 4 },
    cameraBtn: {
      position: 'absolute',
      right: -6,
      bottom: -6,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    logoHint: { color: c.textMuted, fontSize: 12, marginTop: 6 },
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
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: {
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    typeChipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    typeChipText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    typeChipTextSelected: { color: '#FFFFFF' },
    error: { color: '#F87171', fontSize: 13, textAlign: 'center', marginTop: 12 },
  });