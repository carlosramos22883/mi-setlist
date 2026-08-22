import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';
import { globalStyles } from '../styles/global';

export default function AuthScreen() {
  const { login, register } = useAuth();

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
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={globalStyles.logo}>🎵</Text>
        <Text style={globalStyles.title}>Mi SetList</Text>
        <Text style={globalStyles.subtitle}>{isLogin ? '¡Bienvenido de vuelta!' : 'Crea tu cuenta'}</Text>

        <View style={globalStyles.card}>
          {!isLogin && (
            <TextInput
              style={globalStyles.input}
              placeholder="Nombre"
              placeholderTextColor={colors.dark.textMuted}
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={globalStyles.input}
            placeholder="Correo"
            placeholderTextColor={colors.dark.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={globalStyles.input}
            placeholder="Contraseña (mín. 8)"
            placeholderTextColor={colors.dark.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error !== '' && <Text style={globalStyles.error}>{error}</Text>}

          <TouchableOpacity style={globalStyles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={globalStyles.buttonText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switch}
            onPress={() => {
              setMode(isLogin ? 'register' : 'login');
              setError('');
            }}
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

// SOLO lo específico de ESTA pantalla vive aquí
const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  switch: { marginTop: 16, alignItems: 'center' },
});