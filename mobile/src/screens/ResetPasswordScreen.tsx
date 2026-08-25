// ============================================================
// RESET PASSWORD — nueva contraseña usando el token del correo
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as AuthService from '../services/auth.service';
import { colors } from '../constants/theme';
import { globalStyles } from '../styles/global';
import PasswordInput from '../components/PasswordInput';

const c = colors.dark;

interface Props {
  onSuccess: () => void; // vuelve al login cuando termina ok
  onBack: () => void;
}

export default function ResetPasswordScreen({ onSuccess, onBack }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Al montar: extraemos el token de la URL (tanto en web como en app)
  useEffect(() => {
    (async () => {
      // Web: usa window.location
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) setToken(t);
        return;
      }
      // App nativa: usa Linking
      const url = await Linking.getInitialURL();
      if (url) {
        const parsed = Linking.parse(url);
        const t = parsed.queryParams?.token;
        if (typeof t === 'string') setToken(t);
      }
    })();
  }, []);

  async function handleSubmit() {
    setErrors({});
    setGeneralError('');

    if (!token) {
      setGeneralError('El enlace es inválido o ya expiró.');
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(token, password);
      setDone(true);
      // Redirige al login después de 2 segundos para que lea el mensaje
      setTimeout(onSuccess, 2000);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.fields) setErrors(data.fields);
      else setGeneralError(data?.message ?? 'No pudimos actualizar tu contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={globalStyles.title}>Nueva contraseña</Text>
        <Text style={globalStyles.subtitle}>
          {done ? '¡Listo! Ya puedes entrar' : 'Elige una contraseña segura'}
        </Text>

        <View style={globalStyles.card}>
          {!done ? (
            <>
              <PasswordInput
                placeholder="Nueva contraseña"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '', confirmPassword: '' })); }}
                error={errors.password}
              />
              <PasswordInput
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
                error={errors.confirmPassword}
              />

              {generalError !== '' && <Text style={styles.generalError}>{generalError}</Text>}

              <TouchableOpacity style={globalStyles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={globalStyles.buttonText}>Actualizar contraseña</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.success}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>
                Tu contraseña fue actualizada. Volviendo al inicio de sesión…
              </Text>
            </View>
          )}

          {!done && (
            <TouchableOpacity style={styles.back} onPress={onBack}>
              <Text style={globalStyles.link}>← Volver al inicio de sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 8 },
  generalError: {
    color: colors.status.dangerDark,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  back: { marginTop: 16, alignItems: 'center' },
  success: { alignItems: 'center', paddingVertical: 12 },
  successIcon: { fontSize: 48, marginBottom: 8 },
  successText: { color: c.textSecondary, textAlign: 'center', fontSize: 14 },
});