// ============================================================
// App.tsx = punto de entrada de la app (el "main.ts" del móvil)
// ============================================================
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './src/constants/theme';

// Un componente es una función que retorna UI (JSX)
export default function App() {
  return (
    // <View> = contenedor (como un <div>)
    <View style={styles.container}>
      {/* Esto es un comentario en JSX */}
      <Text style={styles.logo}>🎵</Text>
      <Text style={styles.title}>Mi SetList</Text>
      <Text style={styles.subtitle}>Tu repertorio, en tu bolsillo</Text>

      {/* Barra de estado del teléfono en color claro (para fondo oscuro) */}
      <StatusBar style="light" />
    </View>
  );
}

// StyleSheet = tu "CSS": objetos con estilos en vez de clases
const styles = StyleSheet.create({
  container: {
    flex: 1, // ocupa toda la pantalla (como flex: 1 en CSS)
    backgroundColor: colors.dark.bg, // fondo de NUESTRO design system
    alignItems: 'center', // centrado horizontal
    justifyContent: 'center', // centrado vertical
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.dark.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.dark.textSecondary,
  },
});