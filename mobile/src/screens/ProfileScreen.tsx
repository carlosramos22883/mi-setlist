// ============================================================
// PROFILE SCREEN — perfil propio con avatar
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import * as AuthService from '../services/auth.service';
import { uploadImage } from '../services/uploads.service';
import { validatePickedImage } from '../utils/imageValidation';
import ImageCropModal from '../components/ImageCropModal';
import PasswordInput from '../components/PasswordInput';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { API_URL } from '../constants/config';
import { showAlert } from '../utils/dialogs';

interface Props {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: Props) {
  const { user, refreshUser } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const s = buildStyles(c);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const currentAvatarUrl = user?.avatarPath
    ? `${API_URL}/${user.avatarPath}`
    : null;
  const previewUri = avatarLocalUri ?? currentAvatarUrl;

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
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

  async function handleSave() {
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: 'El nombre es obligatorio' });
      return;
    }

    if (!email.trim()) {
      setErrors({ email: 'El correo es obligatorio' });
      return;
    }

    if (newPassword && !currentPassword) {
      setErrors({ currentPassword: 'Para cambiar la contraseña ingresa la actual' });
      return;
    }

    setSaving(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
      };

      if (avatarLocalUri) {
        payload.avatarPath = await uploadImage(avatarLocalUri);
      }

      if (newPassword) {
        // OJO: tu backend actual espera "password", no "newPassword"
        payload.password = newPassword;
      }

      await AuthService.updateProfile(payload);
      await refreshUser();

      showAlert('Éxito', 'Perfil actualizado');
      setCurrentPassword('');
      setNewPassword('');
      setAvatarLocalUri(null);
    } catch (e: any) {
      const data = e?.response?.data ?? e;
      if (data?.fields) setErrors(data.fields);
      else showAlert('Error', data?.message ?? 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={s.scroll}>
      <ScreenHeader title="Mi perfil" subtitle="Edita tu información personal" onBack={onBack} />

      <View style={s.avatarSection}>
        <View style={s.avatarWrap}>
          <View style={s.avatarBox}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Ionicons name="person-outline" size={60} color={c.textMuted} />
              </View>
            )}
          </View>
          <TouchableOpacity style={s.cameraBtn} onPress={pickAvatar}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={s.avatarHint}>Toca la cámara para cambiar tu foto</Text>
      </View>

      <View style={globalStyles.card}>
        <Text style={s.label}>Nombre</Text>
        <TextInput
          style={[globalStyles.input, errors.name && s.inputError]}
          placeholder="Tu nombre"
          placeholderTextColor={c.textMuted}
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
        />
        {errors.name && <Text style={s.error}>{errors.name}</Text>}

        <Text style={s.label}>Correo</Text>
        <TextInput
          style={[globalStyles.input, errors.email && s.inputError]}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={c.textMuted}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
        />
        {errors.email && <Text style={s.error}>{errors.email}</Text>}

        {user?.emailVerifiedAt ? (
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✅ Correo verificado</Text>
          </View>
        ) : (
          <View style={s.unverifiedBadge}>
            <Text style={s.unverifiedText}>⏳ Correo sin verificar</Text>
          </View>
        )}

        <Text style={[s.label, { marginTop: 16 }]}>Cambiar contraseña (opcional)</Text>
        <PasswordInput
          value={currentPassword}
          onChangeText={(t) => { setCurrentPassword(t); setErrors((e) => ({ ...e, currentPassword: '' })); }}
          placeholder="Contraseña actual"
          style={errors.currentPassword ? s.inputError : undefined}
        />
        {errors.currentPassword && <Text style={s.error}>{errors.currentPassword}</Text>}

        <PasswordInput
          value={newPassword}
          onChangeText={(t) => { setNewPassword(t); setErrors((e) => ({ ...e, newPassword: '' })); }}
          placeholder="Nueva contraseña"
          style={errors.newPassword ? s.inputError : undefined}
        />
        {errors.newPassword && <Text style={s.error}>{errors.newPassword}</Text>}

        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 16 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={globalStyles.buttonText}>Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { padding: 24, paddingTop: 16 },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatarWrap: { width: 130, height: 130 },
    avatarBox: {
      width: '100%',
      height: '100%',
      borderRadius: 65, // circular
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
      right: 0,
      bottom: 0,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: c.surface,
    },
    avatarHint: { color: c.textMuted, fontSize: 12, marginTop: 8 },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    inputError: { borderColor: '#F87171' },
    error: { color: '#F87171', fontSize: 12, marginBottom: 8, marginTop: -6 },
    verifiedBadge: {
      backgroundColor: c.accentSoft,
      borderRadius: 9999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    verifiedText: { color: c.accent, fontSize: 12, fontWeight: '600' },
    unverifiedBadge: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderRadius: 9999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    unverifiedText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  });