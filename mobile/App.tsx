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
import SongsScreen from './src/screens/SongsScreen';
import SongDetailScreen from './src/screens/SongDetailScreen';
import SetlistsScreen from './src/screens/SetlistsScreen';
import SetlistDetailScreen from './src/screens/SetlistDetailScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import AppShell from './src/components/AppShell';
import { HeaderActionsProvider } from './src/context/HeaderActionsContext';
import ScreenTransition from './src/components/ScreenTransition';
import Swal from 'sweetalert2';

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
    const myRole = (params.myRole ?? 'member') as 'owner' | 'admin' | 'member';
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
        content = <GroupDetailScreen
          groupId={params.groupId}
          onBack={() => navigate('groups')}
          onNavigate={(to, p) => navigate(to as ScreenName, p)}
          />;
      break;
      case 'songs':
        content = (
          <SongsScreen
            groupId={params.groupId!}
            groupName={params.groupName ?? ''}
            myRole={myRole}
            onBack={() => navigate('groupDetail', { groupId: params.groupId })}
            onOpenSong={(songId) =>
              navigate('songDetail', {
                groupId: params.groupId,
                groupName: params.groupName,
                myRole: params.myRole,
                songId,
              })
            }
          />
        );
      break;
      case 'songDetail':
        content = (
          <SongDetailScreen
            songId={params.songId!}
            groupId={params.groupId!}
            groupName={params.groupName ?? ''}
            myRole={myRole}
            onBack={() =>
              navigate('songs', {
                groupId: params.groupId,
                groupName: params.groupName,
                myRole: params.myRole,
              })
            }
          />
        );
      break;
      case 'setlists':
        content = (
          <SetlistsScreen
            groupId={params.groupId!}
            groupName={params.groupName ?? ''}
            myRole={myRole}
            onBack={() => navigate('groupDetail', { groupId: params.groupId })}
            onOpenSetlist={(setlistId) =>
              navigate('setlistDetail', {
                groupId: params.groupId,
                groupName: params.groupName,
                myRole: params.myRole,
                setlistId,
              })
            }
          />
        );
      break;
            case 'setlistDetail':
        content = (
          <SetlistDetailScreen
            setlistId={params.setlistId!}
            groupId={params.groupId!}
            groupName={params.groupName ?? ''}
            myRole={myRole}
            onBack={() =>
              navigate('setlists', {
                groupId: params.groupId,
                groupName: params.groupName,
                myRole: params.myRole,
              })
            }
          />
        );
      break;
      default:
        content = <HomeScreen onNavigate={navigate} />;
    }
    return <AppShell screen={screen} navigate={navigate}>
      <ScreenTransition key={screen} direction="right">
        {content}
      </ScreenTransition>
    </AppShell>;
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
  // 🆕 Estilos globales de SweetAlert2 (solo web, CSS real inyectado)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('ms-swal-styles')) return;
    const style = document.createElement('style');
    style.id = 'ms-swal-styles';
    style.textContent = `
      .swal2-container { z-index: 2147483647 !important; } /* 🆕 por encima de los Modal de RN */
      .swal2-popup { border-radius: 16px !important; }
      .swal2-title { font-weight: 800 !important; }
      .swal2-styled {
        border-radius: 9999px !important;
        padding: 10px 26px !important;
        font-weight: 700 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <ThemeProvider>
      <HeaderActionsProvider>
        <AuthProvider>
          <Root />
          <StatusBar style="light" />
        </AuthProvider>
      </HeaderActionsProvider>
    </ThemeProvider>
  );
}