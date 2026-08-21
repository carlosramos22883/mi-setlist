// ============================================================
// App.tsx — punto de entrada: decide qué pantalla mostrar
// ============================================================
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import { colors } from './src/constants/theme';

// "Router" manual por ahora: si hay user → Home; si no → Auth
function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    // Mientras restauramos la sesión guardada
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  return user ? <HomeScreen /> : <AuthScreen />;
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