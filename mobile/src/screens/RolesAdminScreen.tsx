// ============================================================
// ROLES ADMIN SCREEN — gestión completa de roles
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as RolesService from '../services/roles.service';
import type { Role, Permission } from '../services/roles.service';
import { colors } from '../constants/theme';
import { globalStyles } from '../styles/global';
import { confirmAction, showAlert } from '../utils/dialogs';

const c = colors.dark;

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

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
  }

  function openEdit(role: Role) {
    setSelectedRole(role);
    setIsCreating(false);
    setEditName(role.name);
    setEditDescription(role.description ?? '');
    setSelectedPermIds(role.permissions.map((p) => p.id));
    setError('');
  }

  function cancelEdit() {
    setSelectedRole(null);
    setIsCreating(false);
    setError('');
  }

  function togglePermission(id: string) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Guardar (crear o actualizar)
  async function handleSave() {
    setError('');
    if (editName.trim() === '') {
      setError('El nombre del rol es obligatorio');
      return;
    }
    if (selectedPermIds.length === 0) {
      setError('Un rol debe tener al menos un permiso');
      showAlert('No se puede guardar', 'Un rol sin permisos no tiene sentido. Selecciona al menos uno.');
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
      cancelEdit();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  // Eliminar con confirmación multiplataforma
  function handleDelete(role: Role) {
    confirmAction(
      'Eliminar rol',
      `¿Seguro que quieres eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
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

  if (loading && roles.length === 0) {
    return (
      <View style={[globalStyles.screen, styles.loadingWrap]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const panelOpen = isCreating || selectedRole !== null;
  const nameLocked = !isCreating && selectedRole?.name === 'Administrador';
  const canEditPanel = can('roles.edit') || isCreating;

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={globalStyles.link}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Roles y permisos</Text>
          <Text style={globalStyles.subtitle}>Gestiona los roles del sistema</Text>
        </View>

        {/* Buscador + botón crear */}
        <View style={styles.toolbar}>
          <TextInput
            style={[globalStyles.input, styles.searchInput]}
            placeholder="Buscar rol..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {can('roles.create') && (
            <TouchableOpacity style={globalStyles.button} onPress={openCreate}>
              <Text style={globalStyles.buttonText}>+ Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de roles con botones editar/eliminar */}
        <View style={styles.rolesList}>
          {filteredRoles.length === 0 && (
            <Text style={styles.empty}>No se encontraron roles</Text>
          )}
          {filteredRoles.map((role) => {
            const isSelected = selectedRole?.id === role.id;
            const isAdmin = role.name === 'Administrador';
            return (
              <View key={role.id} style={[styles.roleCard, isSelected && styles.roleCardSelected]}>
                <View style={styles.roleCardMain}>
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

                  {/* Botones editar / eliminar (igual que en usuarios) */}
                  <View style={styles.actions}>
                    {can('roles.edit') && (
                      <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(role)}>
                        <Text style={styles.iconBtnText}>✏️</Text>
                      </TouchableOpacity>
                    )}
                    {can('roles.delete') && !isAdmin && (
                      <TouchableOpacity
                        style={[styles.iconBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(role)}
                      >
                        <Text style={styles.iconBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Panel de edición / creación */}
        {panelOpen && (
          <View style={styles.editPanel}>
            <Text style={styles.editTitle}>
              {isCreating
                ? 'Nuevo rol'
                : canEditPanel
                  ? `Editar: ${selectedRole?.name}`
                  : `Ver: ${selectedRole?.name}`}
            </Text>

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
              <Text style={styles.hint}>
                ⚠️ Selecciona al menos un permiso.
              </Text>
            )}

            {Object.entries(permissions).map(([group, perms]) => (
              <View key={group} style={styles.permGroup}>
                <Text style={styles.permGroupTitle}>{GROUP_LABELS[group] ?? group}</Text>
                <View style={styles.permChecks}>
                  {perms.map((perm) => {
                    const isChecked = selectedPermIds.includes(perm.id);
                    const isDisabled =
                      !canEditPanel || (nameLocked && isChecked);
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

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[globalStyles.buttonDanger, styles.cancelBtn]}
                onPress={cancelEdit}
                disabled={saving}
              >
                <Text style={globalStyles.buttonText}>
                  {canEditPanel ? 'Cancelar' : 'Cerrar'}
                </Text>
              </TouchableOpacity>

              {canEditPanel && (
                <TouchableOpacity
                  style={[globalStyles.button, styles.saveBtn]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={globalStyles.buttonText}>
                      {isCreating ? 'Crear rol' : 'Guardar cambios'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingTop: 48 },
  header: { marginBottom: 16 },
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, marginBottom: 0 },
  empty: { color: c.textMuted, textAlign: 'center', marginTop: 24 },
  rolesList: { gap: 12, marginBottom: 24 },
  roleCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  roleCardSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  roleCardMain: { flexDirection: 'row', alignItems: 'center' },
  roleCardInfo: { flex: 1 },
  roleName: { color: c.text, fontSize: 16, fontWeight: '700' },
  adminTag: { fontSize: 14 },
  roleDescription: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
  roleMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  usersCount: { color: c.textSecondary, fontSize: 12 },
  permsPreviewText: { color: c.accent, fontSize: 12, fontWeight: '600' },
  permsPreviewEmpty: { color: colors.status.warningDark, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconBtn: {
    backgroundColor: c.surface2,
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  deleteBtn: { backgroundColor: 'rgba(220, 53, 69, 0.15)' },
  iconBtnText: { fontSize: 16 },
  editPanel: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  editTitle: { color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
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
  editActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1 },
  saveBtn: { flex: 1 },
});