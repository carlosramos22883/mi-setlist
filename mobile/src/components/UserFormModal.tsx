// ============================================================
// USER FORM MODAL — formulario reutilizable para crear/editar
// ============================================================
// Lo usamos tanto para CREAR (con contraseña obligatoria)
// como para EDITAR (contraseña opcional, roles preseleccionados).
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import * as RolesService from '../services/roles.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    email: string;
    password: string;
    roleIds: string[];
  }) => Promise<void>;
  // Si viene null, es modo "crear"; si viene un usuario, es modo "editar"
  initialUser?: {
    name: string;
    email: string;
    roles: { id: string; name: string }[];
  } | null;
  title: string;
  submitLabel: string;
  // ID del rol "Usuario" para preseleccionarlo al crear
  defaultRoleId?: string | null;
}

export default function UserFormModal({
  visible,
  onClose,
  onSubmit,
  initialUser,
  title,
  submitLabel,
  defaultRoleId,
}: Props) {
  const isEdit = !!initialUser;

  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [roles, setRoles] = useState<RolesService.Role[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Carga los roles disponibles cuando se abre el modal
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoadingRoles(true);
      try {
        const allRoles = await RolesService.listRoles();
        setRoles(allRoles);

        // Valores iniciales: editar → datos del usuario; crear → vacío + rol Usuario
        if (initialUser) {
          setName(initialUser.name);
          setEmail(initialUser.email);
          setPassword(''); // nunca mostrar contraseña al editar
          setSelectedRoleIds(initialUser.roles.map((r) => r.id));
        } else {
          setName('');
          setEmail('');
          setPassword('');
          setSelectedRoleIds(defaultRoleId ? [defaultRoleId] : []);
        }
      } catch {
        setErrors({ general: 'No se pudieron cargar los roles' });
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [visible, initialUser, defaultRoleId]);

  // Toggle: agregar/quitar un rol de la selección
  function toggleRole(id: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    setErrors({});
    setLoading(true);
    try {
      // Validación local: contraseña obligatoria solo al crear
      if (!isEdit && password.trim() === '') {
        setErrors({ password: 'La contraseña es obligatoria al crear' });
        setLoading(false);
        return;
      }

      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password: password, // puede venir vacía al editar
        roleIds: selectedRoleIds,
      });

      // Éxito: cierra y limpia
      onClose();
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.fields) setErrors(data.fields);
      else setErrors({ general: data?.message ?? 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={globalStyles.title}>{title}</Text>

            <View>
              <TextInput
                style={[globalStyles.input, errors.name ? styles.inputError : null]}
                placeholder="Nombre"
                placeholderTextColor={c.textMuted}
                value={name}
                onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
              />
              {errors.name && <Text style={styles.error}>{errors.name}</Text>}
            </View>

            <View>
              <TextInput
                style={[globalStyles.input, errors.email ? styles.inputError : null]}
                placeholder="Correo"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
              />
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </View>

            <View>
              <TextInput
                style={[globalStyles.input, errors.password ? styles.inputError : null]}
                placeholder={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                placeholderTextColor={c.textMuted}
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
              />
              {errors.password && <Text style={styles.error}>{errors.password}</Text>}
            </View>

            {/* Selector de roles */}
            <Text style={styles.rolesLabel}>Roles</Text>
            {loadingRoles ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <View style={styles.rolesGrid}>
                {roles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.roleChip, isSelected && styles.roleChipSelected]}
                      onPress={() => toggleRole(role.id)}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          isSelected && styles.roleChipTextSelected,
                        ]}
                      >
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {selectedRoleIds.length === 0 && (
              <Text style={styles.hint}>⚠️ Se asignará el rol "Usuario" por defecto</Text>
            )}

            {errors.general && <Text style={styles.generalError}>{errors.general}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[globalStyles.buttonDanger, styles.cancelBtn]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={globalStyles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.button, styles.submitBtn]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={globalStyles.buttonText}>{submitLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: c.surface,
    borderRadius: 16,
    maxHeight: '90%',
  },
  scroll: { padding: 20 },
  inputError: { borderColor: colors.status.dangerDark },
  error: { color: colors.status.dangerDark, fontSize: 12, marginBottom: 8 },
  rolesLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  roleChip: {
    backgroundColor: c.surface2,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  roleChipSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  roleChipText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
  roleChipTextSelected: { color: '#FFFFFF' },
  hint: { color: colors.status.warningDark, fontSize: 12, marginBottom: 8 },
  generalError: {
    color: colors.status.dangerDark,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1 },
});