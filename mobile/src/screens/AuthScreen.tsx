// ============================================================
// AUTH SCREEN — Login y Registro con logo, ojitos, confirmación
// y errores por campo
// ============================================================
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';
import ThemeToggle from '../components/ThemeToggle';

interface Props {
  onForgot: () => void; // callback para ir a la pantalla de "olvidé"
}

// Tipo de los errores por campo que devuelve el backend
type FieldErrors = Record<string, string>;

export default function AuthScreen({ onForgot }: Props) {
  const { login, register } = useAuth();

  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  // Valida la confirmación de contraseña en el cliente
  function validateConfirm(): FieldErrors {
    const e: FieldErrors = {};
    if (!isLogin && password !== confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden';
    }
    return e;
  }

  async function handleSubmit() {
    setErrors({});
    setGeneralError('');

    // 1) Validación local (confirmación)
    const local = validateConfirm();
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.fields) {
        // Errores por campo (del ValidationPipe del backend)
        setErrors(data.fields);
      } else {
        // Error genérico (credenciales inválidas, servidor caído, etc.)
        setGeneralError(data?.message ?? 'Error de conexión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setErrors({});
    setGeneralError('');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={globalStyles.screen}>
      <ThemeToggle floating />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* LOGO */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={globalStyles.title}>Mi SetList</Text>
        <Text style={globalStyles.subtitle}>
          {isLogin ? '¡Bienvenido de vuelta!' : 'Crea tu cuenta'}
        </Text>

        <View style={globalStyles.card}>
          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                style={[globalStyles.input, errors.name ? styles.inputError : null]}
                placeholder="Nombre"
                placeholderTextColor={c.textMuted}
                value={name}
                onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
              />
              {errors.name !== '' && <Text style={styles.error}>{errors.name}</Text>}
            </View>
          )}

          <View style={styles.field}>
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
          </View>

          <View style={styles.field}>
            <PasswordInput
              placeholder="Contraseña"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '', confirmPassword: '' })); }}
              error={errors.password}
            />
          </View>

          {/* Confirmación solo en registro */}
          {!isLogin && (
            <View style={styles.field}>
              <PasswordInput
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
                error={errors.confirmPassword}
              />
            </View>
          )}

          {/* Link "olvidé mi contraseña" (solo en login) */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotLink} onPress={onForgot}>
              <Text style={globalStyles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          {generalError !== '' && <Text style={styles.generalError}>{generalError}</Text>}

          <TouchableOpacity style={globalStyles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={globalStyles.buttonText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switch}
            onPress={() => switchMode(isLogin ? 'register' : 'login')}
          >
            <Text style={globalStyles.link}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 8 },
  field: { marginBottom: 4 },
  inputError: { borderColor: colors.status.dangerDark },
  error: { color: colors.status.dangerDark, fontSize: 12, marginTop: 4, marginLeft: 4 },
  generalError: {
    color: colors.status.dangerDark,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 12 },
  switch: { marginTop: 16, alignItems: 'center' },
});