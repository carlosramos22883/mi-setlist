import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/global';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={[globalStyles.screen, globalStyles.centered]}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={globalStyles.title}>¡Hola, {user?.name}!</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={globalStyles.badge}>
        <Text style={globalStyles.badgeText}>
          {user?.emailVerifiedAt ? '✅ Correo verificado' : '⏳ Correo sin verificar'}
        </Text>
      </View>

      <TouchableOpacity style={[globalStyles.buttonDanger, styles.logout]} onPress={logout}>
        <Text style={globalStyles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 64 },
  email: { fontSize: 14, color: '#A5A3B8', marginTop: 4 },
  logout: { marginTop: 32 },
});