// ============================================================
// USERS ADMIN SCREEN — CRUD completo de usuarios
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Image,
} from 'react-native';
import { confirmAction, showAlert } from '../utils/dialogs';
import { useAuth } from '../context/AuthContext';
import * as UsersService from '../services/users.service';
import type { AdminUser } from '../services/users.service';
import * as RolesService from '../services/roles.service';
import { useTheme } from '../context/ThemeContext';
import { colors, type Palette } from '../constants/theme';
import UserFormModal from '../components/UserFormModal';
import ScreenHeader from '../components/ScreenHeader';
import ListToolbar from '../components/ListToolbar';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import RowActions from '../components/RowActions';
import { API_URL } from '../constants/config';

interface Props {
  onBack: () => void;
}

export default function UsersAdminScreen({ onBack }: Props) {
  const { can, user: currentUser, refreshUser } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const roles = await RolesService.listRoles();
        const usuario = roles.find((r) => r.name === 'Usuario');
        if (usuario) setDefaultRoleId(usuario.id);
      } catch {}
    })();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UsersService.listUsers({
        search: search.trim() || undefined,
        page,
        limit: 10,
        includeDeleted,
      });
      setUsers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      showAlert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, page, includeDeleted]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function onRefresh() {
    setRefreshing(true);
    loadUsers();
  }

  function handleSearch(text: string) {
    setSearch(text);
    setPage(1);
  }

  function openCreate() {
    setEditingUser(null);
    setModalVisible(true);
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setModalVisible(true);
  }

  async function handleModalSubmit(payload: {
    name: string;
    email: string;
    password: string;
    roleIds: string[];
    avatarPath?: string;
  }) {
    if (editingUser) {
      const updatePayload: Record<string, unknown> = {
        name: payload.name,
        email: payload.email,
        roleIds: payload.roleIds,
        avatarPath: payload.avatarPath,
      };
      if (payload.password !== '') updatePayload.password = payload.password;

      await UsersService.updateUser(editingUser.id, updatePayload);

      // 🆕 Si el registro editado es el del usuario logueado,
      // sincroniza el user global (topbar, drawer, perfil).
      if (editingUser.id === currentUser?.id) {
        await refreshUser();
      }
    } else {
      await UsersService.createUser(payload);
    }
    await loadUsers();
  }

  function handleDelete(user: AdminUser) {
    confirmAction(
      'Eliminar usuario',
      `¿Seguro que quieres eliminar a "${user.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await UsersService.deleteUser(user.id);
          await loadUsers();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo eliminar');
        }
      },
    );
  }

  function renderItem({ item }: { item: AdminUser }) {
    const isDeleted = 'deletedAt' in item && item.deletedAt !== null;
    const isMe = item.id === currentUser?.id;
    return (
      <View style={[styles.row, isDeleted && styles.rowDeleted]}>
        {renderAvatar(item)}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.name} {isMe && <Text style={styles.meTag}>(tú)</Text>}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.rolesRow}>
            {item.roles.map((r) => (
              <View key={r.id} style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{r.name}</Text>
              </View>
            ))}
            {item.emailVerifiedAt ? (
              <Text style={styles.verified}>✅</Text>
            ) : (
              <Text style={styles.unverified}>⏳</Text>
            )}
          </View>
          {isDeleted && <Text style={styles.deletedBadge}>ELIMINADO</Text>}
        </View>

        <RowActions
          onEdit={() => openEdit(item)}
          onDelete={() => handleDelete(item)}
          canEdit={can('users.edit')}
          canDelete={can('users.delete') && !isMe}
        />
      </View>
    );
  }

  // Avatar circular con fallback a iniciales (como la topbar)
  function renderAvatar(user: AdminUser, size = 48) {
    const url = user.avatarPath ? `${API_URL}/${user.avatarPath}` : null;
    if (url) {
      return (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2, marginRight: 12 }}
        />
      );
    }
    const initials = user.name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.avatarFallbackText}>{initials}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Usuarios" subtitle="Gestión de cuentas del sistema" onBack={onBack} />

      <ListToolbar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Buscar por nombre o correo..."
        onCreate={can('users.create') ? openCreate : undefined}
      >
        <TouchableOpacity
          style={styles.checkboxWrap}
          onPress={() => setIncludeDeleted((v) => !v)}
        >
          <View style={[styles.checkbox, includeDeleted && styles.checkboxOn]}>
            {includeDeleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Ver eliminados</Text>
        </TouchableOpacity>
      </ListToolbar>

      {loading && users.length === 0 ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState message="No se encontraron usuarios" icon="people-outline" />}
          scrollEnabled={false}
        />
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <UserFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialUser={editingUser}
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        submitLabel={editingUser ? 'Guardar cambios' : 'Crear usuario'}
        defaultRoleId={defaultRoleId}
      />
    </ScrollView>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { padding: 24, paddingTop: 16 },
    loader: { marginTop: 40 },
    row: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    rowDeleted: { opacity: 0.5, backgroundColor: 'rgba(220, 53, 69, 0.1)' },
    userInfo: { flex: 1 },
    userName: { color: c.text, fontSize: 16, fontWeight: '700' },
    meTag: { color: c.accent, fontSize: 12, fontWeight: '400' },
    userEmail: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
    rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
    roleBadge: {
      backgroundColor: c.primarySoft,
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    roleBadgeText: { color: c.primary, fontSize: 11, fontWeight: '600' },
    verified: { fontSize: 12 },
    unverified: { fontSize: 12 },
    deletedBadge: {
      backgroundColor: colors.status.danger,
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    checkboxWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: c.primary, borderColor: c.primary },
    checkmark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    checkboxLabel: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    avatarFallback: {
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarFallbackText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  });