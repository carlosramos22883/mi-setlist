// ============================================================
// HOME SCREEN — panel principal tras el login
// ============================================================
// La sección "Administración" SOLO aparece si el usuario tiene
// permisos (can('users.view') / can('roles.view')): es el
// equivalente móvil de @can en las vistas Blade de Laravel.
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';
import { globalStyles } from '../styles/global';
import type { ScreenName } from '../navigation/useNavigation';

const c = colors.dark;

interface Props {
  onNavigate: (to: ScreenName) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { user, logout, can } = useAuth();

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.scroll}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={globalStyles.title}>¡Hola, {user?.name}!</Text>
      <Text style={globalStyles.subtitle}>{user?.email}</Text>

      <View style={globalStyles.badge}>
        <Text style={globalStyles.badgeText}>
          {user?.emailVerifiedAt ? '✅ Correo verificado' : '⏳ Correo sin verificar'}
        </Text>
      </View>

      <View style={globalStyles.card}>
        <Text style={styles.section}>Tu cuenta</Text>

        <TouchableOpacity style={globalStyles.button} onPress={() => onNavigate('profile')}>
          <Text style={globalStyles.buttonText}>Mi perfil</Text>
        </TouchableOpacity>

        {/* 🔐 Solo visible para usuarios con permisos de administración */}
        {(can('users.view') || can('roles.view')) && (
          <>
            <Text style={styles.section}>Administración</Text>

            {can('users.view') && (
              <TouchableOpacity
                style={[globalStyles.button, styles.admin]}
                onPress={() => onNavigate('usersAdmin')}
              >
                <Text style={globalStyles.buttonText}>Administrar usuarios</Text>
              </TouchableOpacity>
            )}

            {can('roles.view') && (
              <TouchableOpacity
                style={[globalStyles.button, styles.admin]}
                onPress={() => onNavigate('rolesAdmin')}
              >
                <Text style={globalStyles.buttonText}>Roles y permisos</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity style={[globalStyles.buttonDanger, styles.logout]} onPress={logout}>
          <Text style={globalStyles.buttonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48 },
  logo: { width: 96, height: 96, alignSelf: 'center' },
  section: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  admin: { backgroundColor: c.accent }, // azul para diferenciar acciones admin
  logout: { marginTop: 24 },
});