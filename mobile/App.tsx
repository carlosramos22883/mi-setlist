// ============================================================
// App.tsx — punto de entrada: decide qué pantalla mostrar
// ============================================================
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import { useNavigation, type ScreenName } from './src/navigation/useNavigation';
import { colors } from './src/constants/theme';

function Root() {
  const { user, loading } = useAuth();
  const { screen, navigate } = useNavigation('auth');
  const [hasResetToken, setHasResetToken] = useState(false);

  // Al arrancar: detectar si venimos del correo de reset (?token=xxx)
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('token') && window.location.pathname.includes('reset-password')) {
          setHasResetToken(true);
        }
      } else {
        const url = await Linking.getInitialURL();
        if (url?.includes('reset-password') && url.includes('token=')) {
          setHasResetToken(true);
        }
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  // Prioridad 1: si hay sesión activa → Home
  if (user) return <HomeScreen />;

  // Prioridad 2: si venimos del correo con token → pantalla de reset
  if (hasResetToken) {
    return (
      <ResetPasswordScreen
        onSuccess={() => {
          setHasResetToken(false);
          navigate('auth');
          // Limpiamos la URL en web para que no vuelva a entrar al refresco
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
        }}
        onBack={() => {
          setHasResetToken(false);
          navigate('auth');
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
        }}
      />
    );
  }

  // Prioridad 3: navegación normal entre auth / forgot / reset manual
  switch (screen as ScreenName) {
    case 'forgot':
      return <ForgotPasswordScreen onBack={() => navigate('auth')} />;
    case 'reset':
      return (
        <ResetPasswordScreen
          onSuccess={() => navigate('auth')}
          onBack={() => navigate('auth')}
        />
      );
    case 'auth':
    default:
      return <AuthScreen onForgot={() => navigate('forgot')} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.dark.bg, alignItems: 'center', justifyContent: 'center' },
});