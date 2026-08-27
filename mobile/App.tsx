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
import ProfileScreen from './src/screens/ProfileScreen';
import { useNavigation, type ScreenName } from './src/navigation/useNavigation';
import { colors } from './src/constants/theme';
import UsersAdminScreen from './src/screens/UsersAdminScreen';
import RolesAdminScreen from './src/screens/RolesAdminScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import AppShell from './src/components/AppShell';

function Root() {
  const { user, loading } = useAuth();
  const { screen, params, navigate } = useNavigation('auth');
  const [hasResetToken, setHasResetToken] = useState(false);

  // (el useEffect que detecta ?token= queda IGUAL que antes)
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('token') && window.location.pathname.includes('reset-password')) {
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

  // ---------- USUARIO LOGUEADO ----------
    if (user) {
    let content;
    switch (screen) {
      case 'profile':
        content = <ProfileScreen onBack={() => navigate('home')} />;
        break;
      case 'usersAdmin':
        content = <UsersAdminScreen onBack={() => navigate('home')} />;
        break;
      case 'rolesAdmin':
        content = <RolesAdminScreen onBack={() => navigate('home')} />;
        break;
      case 'groups':
        content = <GroupsScreen onNavigate={(to, p) => navigate(to as ScreenName, p)} />;
        break;
      case 'groupDetail':
        content = <GroupDetailScreen groupId={params.groupId} onBack={() => navigate('groups')} />;
        break;
      default:
        content = <HomeScreen onNavigate={navigate} />;
    }
    return <AppShell screen={screen} navigate={navigate}>{content}</AppShell>;
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

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.dark.bg, alignItems: 'center', justifyContent: 'center' },
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
        <StatusBar style="light" />
      </AuthProvider>
    </ThemeProvider>
  );
}