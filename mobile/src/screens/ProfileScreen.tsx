// ============================================================
// PROFILE SCREEN — editar nombre, correo y contraseña propios
// ============================================================
// Regla del backend: si cambias el correo, se revocan tus sesiones
// y debes verificar el nuevo correo → aquí cerramos sesión local.
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as UsersService from '../services/users.service';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';

interface Props {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: Props) {
  const { user, logout, reloadUser } = useAuth();

  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  // Estado inicial = los datos actuales del usuario
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const emailChanged = email.trim() !== (user?.email ?? '');

  async function handleSave() {
    setErrors({});
    setMessage('');
    setLoading(true);
    try {
      // Solo enviamos lo que cambió
      const payload: Record<string, string> = {};
      if (name.trim() !== (user?.name ?? '')) payload.name = name.trim();
      if (emailChanged) payload.email = email.trim();
      if (password !== '') payload.password = password;

      if (Object.keys(payload).length === 0) {
        setMessage('No hay cambios que guardar');
        setLoading(false);
        return;
      }

      const res = await UsersService.updateProfile(payload);

      if (emailChanged) {
        // El backend revocó las sesiones: cerramos también en el móvil
        Alert.alert(
          'Correo actualizado',
          'Cerramos tu sesión y te enviamos un correo de verificación al nuevo correo.',
          [{ text: 'Entendido', onPress: () => logout() }],
        );
      } else {
        setMessage(res.message);
        setPassword('');
        await reloadUser(); // refresca nombre/roles en el Context
      }
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.fields) setErrors(data.fields);
      else setMessage(data?.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.scroll}>
      <Text style={globalStyles.title}>Mi perfil</Text>
      <Text style={globalStyles.subtitle}>Actualiza tus datos personales</Text>

      <View style={globalStyles.card}>
        <View>
          <TextInput
            style={[globalStyles.input, errors.name ? styles.inputError : null]}
            placeholder="Nombre"
            placeholderTextColor={c.textMuted}
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
          />
          {errors.name !== '' && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View>
          <TextInput
            style={[globalStyles.input, errors.email ? styles.inputError : null]}
            placeholder="Correo"
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
          />
          {errors.email !== '' && <Text style={styles.error}>{errors.email}</Text>}
          {emailChanged && (
            <Text style={styles.hint}>
              ⚠️ Al cambiar el correo se cerrará tu sesión y deberás verificarlo de nuevo.
            </Text>
          )}
        </View>

        <PasswordInput
          placeholder="Nueva contraseña (opcional)"
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
          error={errors.password}
        />

        {message !== '' && <Text style={styles.message}>{message}</Text>}

        <TouchableOpacity style={globalStyles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={globalStyles.buttonText}>Guardar cambios</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Text style={globalStyles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48 },
  inputError: { borderColor: colors.status.dangerDark },
  error: { color: colors.status.dangerDark, fontSize: 12, marginBottom: 8 },
  hint: { color: colors.status.warningDark, fontSize: 12, marginBottom: 8 },
  message: { color: colors.status.successDark, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  back: { marginTop: 16, alignItems: 'center' },
});