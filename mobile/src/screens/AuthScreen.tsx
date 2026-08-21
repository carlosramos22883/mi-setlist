// ============================================================
// AUTH SCREEN — Login y Registro en una sola pantalla
// ============================================================
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';

const c = colors.dark; // por ahora diseñamos en oscuro

export default function AuthScreen() {
  const { login, register } = useAuth();

  // useState = la "memoria" del componente: al cambiar, se redibuja
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      // Si llegamos aquí, el Context ya puso el user
      // y la app cambia sola a HomeScreen. ✨
    } catch (e: any) {
      // NestJS devuelve el mensaje en response.data.message
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🎵</Text>
        <Text style={styles.title}>Mi SetList</Text>
        <Text style={styles.subtitle}>
          {isLogin ? '¡Bienvenido de vuelta!' : 'Crea tu cuenta'}
        </Text>

        <View style={styles.card}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={c.textMuted}
              value={name}
              onChangeText={setName} // cada tecla actualiza el state
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña (mín. 8)"
            placeholderTextColor={c.textMuted}
            secureTextEntry // oculta los caracteres
            value={password}
            onChangeText={setPassword}
          />

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switch}
            onPress={() => {
              setMode(isLogin ? 'register' : 'login');
              setError('');
            }}
          >
            <Text style={styles.switchText}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: c.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 20 },
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
  error: { color: colors.status.dangerDark, marginBottom: 10, textAlign: 'center' },
  button: {
    backgroundColor: c.primary,
    borderRadius: 9999, // redondeo full (regla del design system)
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  switch: { marginTop: 16, alignItems: 'center' },
  switchText: { color: c.accent, fontSize: 13 },
});