// ============================================================
// HOME SCREEN — lo que ves cuando ya iniciaste sesión
// ============================================================
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';

const c = colors.dark;

export default function HomeScreen() {
  const { user, logout } = useAuth(); // el Context nos da el usuario

  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>¡Hola, {user?.name}!</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {/* Badge de verificación (dato real que viene de tu API) */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {user?.emailVerifiedAt ? '✅ Correo verificado' : '⏳ Correo sin verificar'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: '700', color: c.text, marginTop: 12 },
  email: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
  badge: {
    backgroundColor: c.primarySoft,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 16,
  },
  badgeText: { color: c.primary, fontSize: 12, fontWeight: '600' },
  button: {
    backgroundColor: colors.status.danger,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 32,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});