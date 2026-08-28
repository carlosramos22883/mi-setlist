// ============================================================
// USER FORM MODAL — crear/editar usuario con avatar redondo
// ============================================================
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as UsersService from '../services/users.service';
import * as RolesService from '../services/roles.service';
import { uploadImage } from '../services/uploads.service';
import { validatePickedImage } from '../utils/imageValidation';
import FormModal from './FormModal';
import ImageCropModal from './ImageCropModal';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { API_URL } from '../constants/config';
import { showAlert } from '../utils/dialogs';
import PasswordInput from './PasswordInput';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    email: string;
    password: string;
    roleIds: string[];
    avatarPath?: string;
  }) => Promise<void>;
  initialUser?: any;
  title: string;
  submitLabel: string;
  defaultRoleId?: string | null;
}

export default function UserFormModal({
  visible,
  onClose,
  onSubmit,
  initialUser,
  title,
  submitLabel,
  defaultRoleId,
}: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [allRoles, setAllRoles] = useState<any[]>([]);

  // Carga roles una sola vez
  useEffect(() => {
    (async () => {
      try {
        const roles = await RolesService.listRoles();
        setAllRoles(roles);
      } catch {}
    })();
  }, []);

  // Precarga al abrir
  useEffect(() => {
    if (visible) {
      setName(initialUser?.name ?? '');
      setEmail(initialUser?.email ?? '');
      setPassword('');
      setRoleIds(initialUser ? initialUser.roles.map((r: any) => r.id) : defaultRoleId ? [defaultRoleId] : []);
      setAvatarLocalUri(null);
      setPendingCropUri(null);
      setErrors({});
    }
  }, [visible, initialUser, defaultRoleId]);

  // Avatar a mostrar
  const currentAvatarUrl = initialUser?.avatarPath
    ? `${API_URL}/${initialUser.avatarPath}`
    : null;
  const previewUri = avatarLocalUri ?? currentAvatarUrl;

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a tus fotos para el avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      aspect: Platform.OS !== 'web' ? [1, 1] : undefined,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    const validation = await validatePickedImage(asset);
    if (!validation.ok) {
      showAlert('Archivo no válido', validation.message ?? 'Selecciona otra imagen.');
      return;
    }

    if (Platform.OS === 'web') setPendingCropUri(asset.uri);
    else setAvatarLocalUri(asset.uri);
  }

  function toggleRole(id: string) {
    setRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!email.trim()) newErrors.email = 'El correo es obligatorio';
    if (!initialUser && !password) newErrors.password = 'La contraseña es obligatoria';
    if (roleIds.length === 0) newErrors.roles = 'Asigna al menos un rol';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      let avatarPath = initialUser?.avatarPath ?? undefined;
      if (avatarLocalUri) avatarPath = await uploadImage(avatarLocalUri);

      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        roleIds,
        avatarPath,
      });
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
    <>
      <FormModal
        visible={visible}
        onClose={onClose}
        title={title}
        submitLabel={submitLabel}
        onSubmit={handleSave}
        loading={saving}
      >
        {/* Avatar con botón de cámara */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={s.avatarBox}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={40} color={c.textMuted} />
                </View>
              )}
            </View>
            <TouchableOpacity style={s.cameraBtn} onPress={pickAvatar}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={s.avatarHint}>Toca la cámara para cambiar la foto</Text>
        </View>

        <Text style={s.label}>Nombre</Text>
        <TextInput
          style={[s.input, errors.name && s.inputError]}
          placeholder="Nombre completo"
          placeholderTextColor={c.textMuted}
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
        />
        {errors.name && <Text style={s.error}>{errors.name}</Text>}

        <Text style={s.label}>Correo</Text>
        <TextInput
          style={[s.input, errors.email && s.inputError]}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={c.textMuted}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
        />
        {errors.email && <Text style={s.error}>{errors.email}</Text>}

        <Text style={s.label}>Contraseña{initialUser && ' (dejar vacío para no cambiar)'}</Text>
        <PasswordInput
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
          placeholder="Contraseña segura"
          style={errors.password ? s.inputError : undefined}
        />
        {errors.password && <Text style={s.error}>{errors.password}</Text>}

        <Text style={s.label}>Roles</Text>
        <View style={s.rolesGrid}>
          {allRoles.map((role) => {
            const selected = roleIds.includes(role.id);
            return (
              <TouchableOpacity
                key={role.id}
                style={[s.roleChip, selected && s.roleChipSelected]}
                onPress={() => toggleRole(role.id)}
              >
                <Text style={[s.roleChipText, selected && s.roleChipTextSelected]}>
                  {role.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.roles && <Text style={s.error}>{errors.roles}</Text>}
      </FormModal>

      {/* Cropper circular: solo existe en web */}
      <ImageCropModal
        visible={pendingCropUri !== null}
        imageUri={pendingCropUri}
        round
        onDone={(dataUrl) => {
          setAvatarLocalUri(dataUrl);
          setPendingCropUri(null);
        }}
        onCancel={() => setPendingCropUri(null)}
      />
    </>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    avatarSection: { alignItems: 'center', marginBottom: 16 },
    avatarWrap: { width: 110, height: 110 },
    avatarBox: {
      width: '100%',
      height: '100%',
      borderRadius: 55, // circular
      overflow: 'hidden',
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraBtn: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    avatarHint: { color: c.textMuted, fontSize: 12, marginTop: 6 },
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
    inputError: { borderColor: '#F87171' },
    error: { color: '#F87171', fontSize: 12, marginBottom: 8, marginTop: -6 },
    rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    roleChip: {
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    roleChipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    roleChipText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    roleChipTextSelected: { color: '#FFFFFF' },
  });