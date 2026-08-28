// ============================================================
// APP SHELL — topbar, sidebar (drawer) y footer fijo
// ============================================================
// Menú lateral con iconos y
// sección activa marcada, topbar con toggle de tema y usuario,
// footer fijo con logo y lema.
import React, { useState } from 'react';
import {
  Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors, type Palette } from '../constants/theme';
import type { ScreenName } from '../navigation/useNavigation';
import ThemeToggle from './ThemeToggle';
import { useHeaderActions } from '../context/HeaderActionsContext';
import { API_URL } from '../constants/config';

interface Props {
  screen: ScreenName;
  navigate: (to: ScreenName, params?: Record<string, any>) => void;
  children: React.ReactNode;
}

export default function AppShell({ screen, navigate, children }: Props) {
  const { user, logout, can } = useAuth();
  const { c } = useTheme();
  const s = buildStyles(c);

  const { actions: headerActions } = useHeaderActions();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatarUrl = user?.avatarPath ? `${API_URL}/${user.avatarPath}` : null;

  function renderAvatar(size = 32) {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }
    return (
      <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
    );
  }

  function go(to: ScreenName) {
    setDrawerOpen(false);
    setMenuOpen(false);
    navigate(to);
  }

  const showAdmin = can('users.view') || can('roles.view');

  // Item del menú lateral
  function menuItem(
    key: ScreenName,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    indent = false,
  ) {
    const active = screen === key;
    return (
      <TouchableOpacity
        key={key}
        style={[s.menuItem, indent && s.menuItemIndent, active && s.menuItemActive]}
        onPress={() => go(key)}
      >
        <Ionicons
          name={icon}
          size={20}
          color={active ? c.primary : c.textSecondary}
          style={s.menuIcon}
        />
        <Text style={[s.menuLabel, active && s.menuLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.root}>
      {/* ================= TOP BAR ================= */}
      <View style={s.topbar}>
        <View style={s.row}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu-outline" size={24} color={c.text} />
          </TouchableOpacity>
          <Image source={require('../../assets/logo.png')} style={s.topbarLogo} />
          <Text style={s.topbarTitle}>Mi SetList</Text>
        </View>

        <View style={s.row}>
          {headerActions}
          <ThemeToggle />          

          <TouchableOpacity style={s.userChip} onPress={() => setMenuOpen((v) => !v)}>
            {renderAvatar(32)}
            <Text style={s.userName} numberOfLines={1}>{user?.name}</Text>
            <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown del usuario */}
      {menuOpen && (
        <>
          <TouchableOpacity style={s.fullOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          <View style={s.dropdown}>
            <TouchableOpacity style={s.dropdownItem} onPress={() => go('profile')}>
              <Ionicons name="person-outline" size={18} color={c.text} style={s.menuIcon} />
              <Text style={s.dropdownText}>Mi perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dropdownItem} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color={colors.status.dangerDark} style={s.menuIcon} />
              <Text style={[s.dropdownText, { color: colors.status.dangerDark }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ================= DRAWER (sidebar) ================= */}
      {drawerOpen && (
        <>
          <TouchableOpacity style={s.fullOverlay} activeOpacity={1} onPress={() => setDrawerOpen(false)} />
          <View style={s.drawer}>
            <View style={s.drawerHeader}>
              <Image source={require('../../assets/logo.png')} style={s.drawerLogo} />
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Ionicons name="close-outline" size={24} color={c.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.drawerMenu} contentContainerStyle={s.drawerMenuInner}>
              {menuItem('home', 'Inicio', 'home-outline')}              

              {showAdmin && (
                <>
                  <TouchableOpacity
                    style={s.menuItem}
                    onPress={() => setAdminOpen((v) => !v)}
                  >
                    <Ionicons name="shield-checkmark-outline" size={20} color={c.textSecondary} style={s.menuIcon} />
                    <Text style={s.menuLabel}>Administración</Text>
                    <Ionicons
                      name={adminOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={c.textSecondary}
                    />
                  </TouchableOpacity>
                  {adminOpen && (
                    <>
                      {can('users.view') && menuItem('usersAdmin', 'Usuarios', 'people-outline', true)}
                      {can('roles.view') && menuItem('rolesAdmin', 'Roles y Permisos', 'key-outline', true)}
                    </>
                  )}
                </>
              )}

              {menuItem('groups', 'Mis grupos', 'musical-notes-outline')}
            </ScrollView>

            {/* Parte baja del drawer: usuario + perfil + logout */}
            <View style={s.drawerFooter}>
              <View style={s.row}>
                {renderAvatar(32)}
                <View style={{ flex: 1 }}>
                  <Text style={s.drawerUserName} numberOfLines={1}>{user?.name}</Text>
                  <Text style={s.drawerUserEmail} numberOfLines={1}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={s.menuItem} onPress={() => go('profile')}>
                <Ionicons name="person-outline" size={20} color={c.textSecondary} style={s.menuIcon} />
                <Text style={s.menuLabel}>Mi perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.menuItem} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color={colors.status.dangerDark} style={s.menuIcon} />
                <Text style={[s.menuLabel, { color: colors.status.dangerDark }]}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* ================= CONTENIDO ================= */}
      <View style={s.content}>{children}</View>

      {/* ================= FOOTER FIJO ================= */}
      <View style={s.footer}>
        <Image source={require('../../assets/logo.png')} style={s.footerLogo} />
        <Text style={s.footerText}>Mi SetList · Tu repertorio, en tu bolsillo</Text>
      </View>
    </View>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    topbarLogo: { width: 32, height: 32, borderRadius: 8 },
    topbarTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
    iconBtn: { padding: 6 },
    userChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingLeft: 4,
      paddingRight: 10,
      paddingVertical: 4,
      maxWidth: 220,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    userName: { color: c.text, fontSize: 13, fontWeight: '600' },
    fullOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 40,
    },
    dropdown: {
      position: 'absolute',
      top: 56,
      right: 16,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 6,
      zIndex: 50,
      minWidth: 180,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    dropdownText: { color: c.text, fontSize: 14 },
    drawer: {
      position: 'absolute',
      top: 0, left: 0, bottom: 0,
      width: 280,
      backgroundColor: c.surface,
      zIndex: 50,
      borderRightWidth: 1,
      borderRightColor: c.border,
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    drawerLogo: { width: 40, height: 40, borderRadius: 10 },
    drawerMenu: { flex: 1 },
    drawerMenuInner: { padding: 12 },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 2,
    },
    menuItemIndent: { marginLeft: 20 },
    menuItemActive: { backgroundColor: c.primarySoft },
    menuIcon: { marginRight: 12 },
    menuLabel: { color: c.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 },
    menuLabelActive: { color: c.primary, fontWeight: '700' },
    drawerFooter: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    drawerUserName: { color: c.text, fontSize: 13, fontWeight: '700' },
    drawerUserEmail: { color: c.textMuted, fontSize: 11 },
    content: { flex: 1 },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerLogo: { width: 22, height: 22, borderRadius: 6 },
    footerText: { color: c.textMuted, fontSize: 12 },
  });