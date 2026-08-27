// ============================================================
// CREATE GROUP SCREEN — formulario para crear un grupo musical
// ============================================================
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as GroupsService from '../services/groups.service';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { showAlert } from '../utils/dialogs';

const API_URL = 'http://localhost:3000/api/v1';

interface Props {
  onBack: () => void;
  onCreated: () => void;
}

const GROUP_TYPES = [
  { value: 'band', label: '🎸 Banda' },
  { value: 'choir', label: '🎤 Coro' },
  { value: 'orchestra', label: '🎻 Orquesta' },
  { value: 'vocal_group', label: '🎶 Grupo vocal' },
  { value: 'other', label: '🎵 Otro' },
] as const;

type GroupType = (typeof GROUP_TYPES)[number]['value'];

export default function CreateGroupScreen({ onBack, onCreated }: Props) {
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GroupType>('band');
  const [logoLocalUri, setLogoLocalUri] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a tus fotos para el logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // ← recortador nativo del SO
      aspect: [1, 1],       // cuadrado
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLogoLocalUri(asset.uri);
    setLogoPath(null); // marcamos que aún hay que subir
  }

  // Sube la imagen al servidor y devuelve la ruta relativa
  async function uploadLogoIfNeeded(): Promise<string | undefined> {
    if (!logoLocalUri || logoPath) return logoPath ?? undefined;
    const path = await GroupsService.uploadLogo(logoLocalUri);
    setLogoPath(path);
    return path;
  }

  async function handleCreate() {
    setErrors({});
    setLoading(true);
    try {
      const uploadedLogoPath = await uploadLogoIfNeeded();

      await GroupsService.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        logoPath: uploadedLogoPath,
      });

      showAlert('¡Grupo creado!', `"${name}" ya está listo. Eres el dueño.`);
      onCreated();
    } catch (e: any) {
      const data = e?.response?.data ?? e;
      if (data?.fields) setErrors(data.fields);
      else showAlert('Error', data?.message ?? 'No se pudo crear el grupo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={globalStyles.link}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Nuevo grupo</Text>
          <Text style={globalStyles.subtitle}>
            Crea un grupo musical e invita a otros músicos
          </Text>
        </View>

        <View style={styles.logoSection}>
          <TouchableOpacity style={styles.logoBox} onPress={pickLogo}>
            {logoLocalUri ? (
              <Image source={{ uri: logoLocalUri }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>📷</Text>
                <Text style={styles.logoPlaceholderLabel}>Agregar logo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.logoHint}>Se recortará en cuadrado</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[globalStyles.input, errors.name ? styles.inputError : null]}
            placeholder="Ej: Los Rockeros"
            placeholderTextColor={c.textMuted}
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
          />
          {errors.name !== '' && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[globalStyles.input, styles.descriptionInput]}
            placeholder="Breve descripción del grupo..."
            placeholderTextColor={c.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tipo de grupo</Text>
          <View style={styles.typeGrid}>
            {GROUP_TYPES.map((t) => {
              const selected = t.value === type;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                  onPress={() => setType(t.value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      selected && styles.typeChipTextSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[globalStyles.buttonDanger, styles.cancelBtn]}
            onPress={onBack}
            disabled={loading}
          >
            <Text style={globalStyles.buttonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.button, styles.submitBtn]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={globalStyles.buttonText}>Crear grupo</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48 },
  header: { marginBottom: 16 },
  logoSection: { alignItems: 'center', marginBottom: 20 },
  logoBox: {
    width: 140,
    height: 140,
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
  logoPlaceholderText: { fontSize: 40 },
  logoPlaceholderLabel: { color: c.textSecondary, fontSize: 12, marginTop: 4 },
  logoHint: { color: c.textMuted, fontSize: 12, marginTop: 6 },
  field: { marginBottom: 16 },
  label: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  descriptionInput: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: colors.status.dangerDark },
  error: { color: colors.status.dangerDark, fontSize: 12, marginTop: 4 },
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
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1 },
});