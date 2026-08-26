// ============================================================
// App.tsx — punto de entrada: decide qué pantalla mostrar
// ============================================================
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { useNavigation, type ScreenName } from './src/navigation/useNavigation';
import { colors } from './src/constants/theme';
import UsersAdminScreen from './src/screens/UsersAdminScreen';
import RolesAdminScreen from './src/screens/RolesAdminScreen';

function Root() {
  const { user, loading } = useAuth();
  const { screen, navigate } = useNavigation('auth');
  const [hasResetToken, setHasResetToken] = useState(false);

  // (el useEffect que detecta ?token= queda IGUAL que antes)

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  // ---------- USUARIO LOGUEADO ----------
  if (user) {
    switch (screen) {
      case 'profile':
        return <ProfileScreen onBack={() => navigate('home')} />;
      case 'usersAdmin':
        return <UsersAdminScreen onBack={() => navigate('home')} />;
      case 'rolesAdmin':
        return <RolesAdminScreen onBack={() => navigate('home')} />;     
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  }

  // ---------- NO LOGUEADO ----------
  if (hasResetToken) {
    return (
      <ResetPasswordScreen
        onSuccess={() => { setHasResetToken(false); navigate('auth'); cleanWebUrl(); }}
        onBack={() => { setHasResetToken(false); navigate('auth'); cleanWebUrl(); }}
      />
    );
  }

  switch (screen) {
    case 'forgot':
      return <ForgotPasswordScreen onBack={() => navigate('auth')} />;
    default:
      return <AuthScreen onForgot={() => navigate('forgot')} />;
  }
}

// Limpia el ?token= de la URL en web para que no reviva al refrescar
function cleanWebUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/');
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