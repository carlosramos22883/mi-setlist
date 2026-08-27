// ============================================================
// ROLES ADMIN SCREEN — gestión de roles con FormModal estándar
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as RolesService from '../services/roles.service';
import type { Role, Permission } from '../services/roles.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { colors } from '../constants/theme';
import { confirmAction, showAlert } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import ListToolbar from '../components/ListToolbar';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import RowActions from '../components/RowActions';

const GROUP_LABELS: Record<string, string> = {
  users: 'Usuarios',
  roles: 'Roles',
  profile: 'Perfil propio',
};

interface Props {
  onBack: () => void;
}

export default function RolesAdminScreen({ onBack }: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        RolesService.listRoles(),
        RolesService.listPermissions(),
      ]);
      setRoles(r);
      setPermissions(p);
    } catch {
      showAlert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function openCreate() {
    setSelectedRole(null);
    setIsCreating(true);
    setEditName('');
    setEditDescription('');
    setSelectedPermIds([]);
    setError('');
    setModalVisible(true);
  }

  function openEdit(role: Role) {
    setSelectedRole(role);
    setIsCreating(false);
    setEditName(role.name);
    setEditDescription(role.description ?? '');
    setSelectedPermIds(role.permissions.map((p) => p.id));
    setError('');
    setModalVisible(true);
  }

  function togglePermission(id: string) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    setError('');
    if (editName.trim() === '') {
      setError('El nombre del rol es obligatorio');
      return;
    }
    if (selectedPermIds.length === 0) {
      setError('Un rol debe tener al menos un permiso');
      showAlert('No se puede guardar', 'Selecciona al menos un permiso.');
      return;
    }
    setSaving(true);
    try {
      if (isCreating) {
        await RolesService.createRole({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          permissionIds: selectedPermIds,
        });
        showAlert('Éxito', 'Rol creado correctamente');
      } else if (selectedRole) {
        await RolesService.updateRole(selectedRole.id, {
          name: editName.trim(),
          description: editDescription.trim(),
          permissionIds: selectedPermIds,
        });
        showAlert('Éxito', 'Rol actualizado correctamente');
      }
      await load();
      setModalVisible(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(role: Role) {
    confirmAction(
      'Eliminar rol',
      `¿Seguro que quieres eliminar el rol "${role.name}"?`,
      async () => {
        try {
          await RolesService.deleteRole(role.id);
          showAlert('Éxito', 'Rol eliminado correctamente');
          await load();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo eliminar');
        }
      },
    );
  }

  const nameLocked = !isCreating && selectedRole?.name === 'Administrador';
  const canEditPanel = can('roles.edit') || isCreating;

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Roles y Permisos" subtitle="Gestiona los roles del sistema" onBack={onBack} />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar rol..."
        onCreate={can('roles.create') ? openCreate : undefined}
      />

      {loading && roles.length === 0 ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        <>
          {filteredRoles.length === 0 && (
            <EmptyState message="No se encontraron roles" icon="key-outline" />
          )}
          {filteredRoles.map((role) => {
            const isAdmin = role.name === 'Administrador';
            return (
              <View key={role.id} style={styles.roleCard}>
                <TouchableOpacity
                  style={styles.roleCardInfo}
                  onPress={() => openEdit(role)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleName}>
                    {role.name} {isAdmin && <Text style={styles.adminTag}>🛡️</Text>}
                  </Text>
                  {role.description !== null && role.description !== '' && (
                    <Text style={styles.roleDescription}>{role.description}</Text>
                  )}
                  <View style={styles.roleMeta}>
                    <Text style={styles.usersCount}>
                      👥 {role.usersCount} {role.usersCount === 1 ? 'usuario' : 'usuarios'}
                    </Text>
                    <Text
                      style={
                        role.permissions.length > 0
                          ? styles.permsPreviewText
                          : styles.permsPreviewEmpty
                      }
                    >
                      {role.permissions.length > 0
                        ? `🔑 ${role.permissions.length} permisos`
                        : '⚠️ Sin permisos'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <RowActions
                  onEdit={() => openEdit(role)}
                  onDelete={() => handleDelete(role)}
                  canEdit={can('roles.edit')}
                  canDelete={can('roles.delete') && !isAdmin}
                />
              </View>
            );
          })}
        </>
      )}

      {/* Modal estándar de crear/editar rol */}
      <FormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={isCreating ? 'Nuevo rol' : `Editar: ${selectedRole?.name}`}
        submitLabel={isCreating ? 'Crear rol' : 'Guardar cambios'}
        onSubmit={canEditPanel ? handleSave : undefined}
        loading={saving}
      >
        {nameLocked && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              🛡️ El rol Administrador siempre conserva todos los permisos.
            </Text>
          </View>
        )}

        {canEditPanel && (
          <>
            <TextInput
              style={globalStyles.input}
              placeholder="Nombre del rol"
              placeholderTextColor={c.textMuted}
              value={editName}
              onChangeText={setEditName}
              editable={!nameLocked}
            />
            <TextInput
              style={[globalStyles.input, styles.descriptionInput]}
              placeholder="Descripción"
              placeholderTextColor={c.textMuted}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
          </>
        )}

        <Text style={styles.permsLabel}>Permisos</Text>
        {selectedPermIds.length === 0 && canEditPanel && (
          <Text style={styles.hint}>⚠️ Selecciona al menos un permiso.</Text>
        )}

        {Object.entries(permissions).map(([group, perms]) => (
          <View key={group} style={styles.permGroup}>
            <Text style={styles.permGroupTitle}>{GROUP_LABELS[group] ?? group}</Text>
            <View style={styles.permChecks}>
              {perms.map((perm) => {
                const isChecked = selectedPermIds.includes(perm.id);
                const isDisabled = !canEditPanel || (nameLocked && isChecked);
                return (
                  <TouchableOpacity
                    key={perm.id}
                    style={[styles.permCheck, isChecked && styles.permCheckOn]}
                    onPress={() => !isDisabled && togglePermission(perm.id)}
                    disabled={isDisabled}
                  >
                    <Text style={styles.permCheckIcon}>{isChecked ? '☑' : '☐'}</Text>
                    <View style={styles.permCheckLabel}>
                      <Text style={styles.permCheckName}>{perm.name}</Text>
                      {perm.description !== null && (
                        <Text style={styles.permCheckDesc}>{perm.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {error !== '' && <Text style={styles.error}>{error}</Text>}
      </FormModal>
    </ScrollView>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { padding: 24, paddingTop: 16 },
    loader: { marginTop: 40 },
    roleCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    roleCardInfo: { flex: 1 },
    roleName: { color: c.text, fontSize: 16, fontWeight: '700' },
    adminTag: { fontSize: 14 },
    roleDescription: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
    roleMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
    usersCount: { color: c.textSecondary, fontSize: 12 },
    permsPreviewText: { color: c.accent, fontSize: 12, fontWeight: '600' },
    permsPreviewEmpty: { color: colors.status.warningDark, fontSize: 12 },
    warning: { backgroundColor: colors.status.warning, borderRadius: 8, padding: 12, marginBottom: 16 },
    warningText: { color: '#1F2937', fontSize: 13, fontWeight: '600' },
    descriptionInput: { minHeight: 60, textAlignVertical: 'top' },
    permsLabel: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 8,
      marginTop: 16,
    },
    hint: { color: colors.status.warningDark, fontSize: 12, marginBottom: 12 },
    permGroup: { marginBottom: 16 },
    permGroupTitle: { color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    permChecks: { gap: 6 },
    permCheck: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.surface2,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    permCheckOn: { backgroundColor: c.primarySoft, borderColor: c.primary },
    permCheckIcon: { fontSize: 18, marginRight: 10, color: c.text },
    permCheckLabel: { flex: 1 },
    permCheckName: { color: c.text, fontSize: 13, fontWeight: '600' },
    permCheckDesc: { color: c.textSecondary, fontSize: 11, marginTop: 2 },
    error: { color: colors.status.dangerDark, fontSize: 13, textAlign: 'center', marginTop: 12 },
  });