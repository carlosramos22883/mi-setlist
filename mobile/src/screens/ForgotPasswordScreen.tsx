// ============================================================
// FORGOT PASSWORD — pide el correo para enviar el link de reset
// ============================================================
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as AuthService from '../services/auth.service';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: Props) {
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim());
      setSent(true); // mostramos mensaje de éxito (el backend siempre responde ok por seguridad)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={globalStyles.screen}>
      <ThemeToggle floating />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={globalStyles.title}>Recuperar contraseña</Text>
        <Text style={globalStyles.subtitle}>
          Te enviaremos un enlace para restablecerla
        </Text>

        <View style={globalStyles.card}>
          {!sent ? (
            <>
              <TextInput
                style={[globalStyles.input, error ? styles.inputError : null]}
                placeholder="Tu correo"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
              />
              {error !== '' && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity style={globalStyles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={globalStyles.buttonText}>Enviar enlace</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.success}>
              <Text style={styles.successIcon}>📬</Text>
              <Text style={styles.successText}>
                Si el correo está registrado, te enviamos las instrucciones.
                Revisa tu bandeja de entrada y spam.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.back} onPress={onBack}>
            <Text style={globalStyles.link}>← Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 8 },
  inputError: { borderColor: colors.status.dangerDark },
  error: { color: colors.status.dangerDark, fontSize: 12, marginBottom: 10 },
  back: { marginTop: 16, alignItems: 'center' },
  success: { alignItems: 'center', paddingVertical: 12 },
  successIcon: { fontSize: 48, marginBottom: 8 },
  successText: { color: c.textSecondary, textAlign: 'center', fontSize: 14 },
});