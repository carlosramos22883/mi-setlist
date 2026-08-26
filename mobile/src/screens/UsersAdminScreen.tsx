// ============================================================
// USERS ADMIN SCREEN — CRUD completo de usuarios
// ============================================================
// Lista con búsqueda + paginación.
// Crear / Editar / Eliminar se muestran SOLO si el usuario
// tiene el permiso correspondiente (can('users.create'), etc.).
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as UsersService from '../services/users.service';
import type { AdminUser } from '../services/users.service';
import * as RolesService from '../services/roles.service';
import { colors } from '../constants/theme';
import { globalStyles } from '../styles/global';
import UserFormModal from '../components/UserFormModal';

const c = colors.dark;

interface Props {
  onBack: () => void;
}

export default function UsersAdminScreen({ onBack }: Props) {
  const { can, user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // ID del rol "Usuario" para preseleccionarlo al crear
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null);

  // Carga el ID del rol "Usuario" una sola vez
  useEffect(() => {
    (async () => {
      try {
        const roles = await RolesService.listRoles();
        const usuario = roles.find((r) => r.name === 'Usuario');
        if (usuario) setDefaultRoleId(usuario.id);
      } catch {
        // si falla, seguimos sin preselección
      }
    })();
  }, []);

  // Carga la lista de usuarios (se re-ejecuta al cambiar page/search)
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UsersService.listUsers({
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      setUsers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Pull-to-refresh (desliza hacia abajo para recargar)
  function onRefresh() {
    setRefreshing(true);
    loadUsers();
  }

  // Buscar: resetea a la página 1
  function handleSearch(text: string) {
    setSearch(text);
    setPage(1);
  }

  // Abrir modal para CREAR
  function openCreate() {
    setEditingUser(null);
    setModalVisible(true);
  }

  // Abrir modal para EDITAR
  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setModalVisible(true);
  }

  // Envío del formulario (crear o editar)
  async function handleModalSubmit(payload: {
    name: string;
    email: string;
    password: string;
    roleIds: string[];
  }) {
    if (editingUser) {
      // Modo EDITAR: solo enviamos lo que cambió
      const updatePayload: Record<string, unknown> = {
        name: payload.name,
        email: payload.email,
        roleIds: payload.roleIds,
      };
      if (payload.password !== '') updatePayload.password = payload.password;
      await UsersService.updateUser(editingUser.id, updatePayload);
    } else {
      // Modo CREAR
      await UsersService.createUser(payload);
    }
    // Recargar la lista para ver los cambios
    await loadUsers();
  }

  // Eliminar con confirmación
  function handleDelete(user: AdminUser) {
    const confirmMessage = `¿Seguro que quieres eliminar a "${user.name}"? Esta acción no se puede deshacer.`;

    const performDelete = async () => {
        try {
        await UsersService.deleteUser(user.id);
        await loadUsers();
        } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo eliminar');
        }
    };

    // Si estamos en la web, usar window.confirm nativo
    if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(confirmMessage)) {
        performDelete();
        }
        return;
    }

    // Si es móvil nativo (iOS / Android)
    Alert.alert(
        'Eliminar usuario',
        confirmMessage,
        [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: performDelete },
        ],
    );
}


  // Render de cada fila de usuario
  function renderItem({ item }: { item: AdminUser }) {
    const isMe = item.id === currentUser?.id;
    return (
      <View style={styles.row}>
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
        </View>

        <View style={styles.actions}>
          {can('users.edit') && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Text style={styles.iconBtnText}>✏️</Text>
            </TouchableOpacity>
          )}
          {can('users.delete') && !isMe && (
            <TouchableOpacity
              style={[styles.iconBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.iconBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={globalStyles.link}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Usuarios</Text>
        </View>

        {/* Buscador + botón crear */}
        <View style={styles.toolbar}>
          <TextInput
            style={[globalStyles.input, styles.searchInput]}
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {can('users.create') && (
            <TouchableOpacity style={globalStyles.button} onPress={openCreate}>
              <Text style={globalStyles.buttonText}>+ Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de usuarios */}
        {loading && users.length === 0 ? (
          <ActivityIndicator color={c.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>No se encontraron usuarios</Text>
            }
            scrollEnabled={false} // el ScrollView exterior maneja el scroll
          />
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[globalStyles.button, styles.pageBtn]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Text style={globalStyles.buttonText}>← Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              Página {page} de {totalPages}
            </Text>
            <TouchableOpacity
              style={[globalStyles.button, styles.pageBtn]}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <Text style={globalStyles.buttonText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <UserFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialUser={editingUser}
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        submitLabel={editingUser ? 'Guardar cambios' : 'Crear usuario'}
        defaultRoleId={defaultRoleId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48 },
  header: { marginBottom: 16 },
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, marginBottom: 0 },
  loader: { marginTop: 40 },
  empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
  row: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    backgroundColor: c.surface2,
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  deleteBtn: { backgroundColor: 'rgba(220, 53, 69, 0.15)' },
  iconBtnText: { fontSize: 16 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  pageBtn: { flex: 1 },
  pageInfo: { color: c.textSecondary, fontSize: 13 },
});