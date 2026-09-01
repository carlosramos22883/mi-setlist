// ============================================================
// GROUP DETAIL SCREEN — info, miembros y acciones contextuales
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as GroupsService from '../services/groups.service';
import type { GroupDetail, GroupMember } from '../services/groups.service';
import { type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { confirmAction, showAlert } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import RowActions from '../components/RowActions';
import { useHeaderActions } from '../context/HeaderActionsContext';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3000/api/v1';

interface Props {
  groupId: string;
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

const TYPE_LABELS: Record<string, string> = {
  band: '🎸 Banda',
  choir: '🎤 Coro',
  orchestra: '🎻 Orquesta',
  vocal_group: '🎶 Grupo vocal',
  other: '🎵 Otro',
};

const ROLE_LABELS: Record<string, string> = {
  owner: '👑 Dueño',
  admin: '⭐ Admin',
  member: '🎵 Miembro',
};

export default function GroupDetailScreen({ groupId, onBack, onNavigate }: Props) {
  const { setActions } = useHeaderActions();
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);
  // 🆕 Traemos `can` para la doble validación
  const { user: currentUser, can } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    try {
      const g = await GroupsService.getGroup(groupId);
      setGroup(g);
    } catch (e: any) {
      showAlert('Error', e?.response?.data?.message ?? 'No se pudo cargar el grupo');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // ¿Qué puede hacer el usuario actual? (doble capa: global + contextual)
  // 🆕 Calculamos las variables de permiso DESPUÉS de tener el grupo
  const myRole = group?.myRole;
  const canEditGroup = can('groups.edit') && (myRole === 'owner' || myRole === 'admin');
  const canInvite = can('members.invite') && (myRole === 'owner' || myRole === 'admin');
  const canRemove = can('members.remove') && (myRole === 'owner' || myRole === 'admin');
  const canChangeRoles = can('members.change_role') && myRole === 'owner';
  const canDelete = can('groups.delete') && myRole === 'owner';
  const canLeave = myRole !== 'owner' && myRole !== undefined; // cualquier miembro no-owner

  // Registra las acciones al montar
  // 🆕 Usa las variables de doble capa + agregamos canInvite y canDelete al array de deps
  useEffect(() => {
    if (!group) return;
    setActions(
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {canInvite && (
          <TouchableOpacity
            style={{ padding: 6 }}
            onPress={() => setInviteModalVisible(true)}
          >
            <Ionicons name="mail-outline" size={22} color={c.text} />
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity style={{ padding: 6 }} onPress={handleDeleteGroup}>
            <Ionicons name="trash-outline" size={22} color={c.text} />
          </TouchableOpacity>
        )}
      </View>
    );
    return () => setActions(null);
  }, [group, c, canInvite, canDelete]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await GroupsService.inviteMember(groupId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      showAlert('Invitación enviada', `Se envió una invitación a ${inviteEmail}`);
      setInviteEmail('');
      setInviteModalVisible(false);
    } catch (e: any) {
      showAlert('Error', e?.response?.data?.message ?? 'No se pudo enviar la invitación');
    } finally {
      setInviting(false);
    }
  }

  function handleChangeRole(member: GroupMember) {
    if (member.user.id === group?.ownerId) {
      showAlert('No permitido', 'No puedes cambiar el rol del dueño');
      return;
    }
    const newRole: 'admin' | 'member' = member.role === 'admin' ? 'member' : 'admin';
    confirmAction(
      'Cambiar rol',
      `¿${newRole === 'admin' ? 'Hacer admin' : 'Quitar admin'} a ${member.user.name}?`,
      async () => {
        try {
          await GroupsService.updateMemberRole(groupId, member.id, newRole);
          await loadGroup();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo cambiar el rol');
        }
      },
    );
  }

  function handleRemoveMember(member: GroupMember) {
    if (member.user.id === group?.ownerId) {
      showAlert('No permitido', 'No puedes expulsar al dueño');
      return;
    }
    confirmAction(
      'Expulsar miembro',
      `¿Seguro que quieres expulsar a "${member.user.name}"?`,
      async () => {
        try {
          await GroupsService.removeMember(groupId, member.id);
          await loadGroup();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo expulsar');
        }
      },
    );
  }

  function handleLeave() {
    confirmAction(
      'Abandonar grupo',
      `¿Seguro que quieres abandonar "${group?.name}"?`,
      async () => {
        try {
          await GroupsService.leaveGroup(groupId);
          showAlert('Adiós', 'Has abandonado el grupo');
          onBack();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo abandonar');
        }
      },
    );
  }

  function handleDeleteGroup() {
    confirmAction(
      'Eliminar grupo',
      `¿Eliminar "${group?.name}"? Esta acción desactivará el grupo.`,
      async () => {
        try {
          await GroupsService.deleteGroup(groupId);
          showAlert('Eliminado', 'El grupo ha sido eliminado');
          onBack();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo eliminar');
        }
      },
    );
  }

  if (loading) {
    return (
      <View style={[globalStyles.screen, styles.loadingWrap]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[globalStyles.screen, styles.loadingWrap]}>
        <Text style={styles.empty}>Grupo no encontrado</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={globalStyles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const logoUrl = group.logoPath ? `${API_URL}/${group.logoPath}` : null;

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title={group.name} subtitle={TYPE_LABELS[group.type]} onBack={onBack} />

        <View style={styles.groupHeader}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.groupLogo} />
          ) : (
            <View style={[styles.groupLogo, styles.logoPlaceholder]}>
              <Text style={styles.logoPlaceholderText}>🎵</Text>
            </View>
          )}
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupType}>{TYPE_LABELS[group.type]}</Text>
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
          <Text style={styles.myRoleBadge}>Tu rol: {ROLE_LABELS[group.myRole]}</Text>
        </View>

        {/* Acciones del grupo (todas del mismo tamaño) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[globalStyles.button, styles.actionBtn]}
            onPress={() =>
              onNavigate('songs', {
                groupId: group.id,
                groupName: group.name,
                myRole: group.myRole,
              })
            }
          >
            <Text style={globalStyles.buttonText}>🎵 Canciones</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.button, styles.actionBtn]}
            onPress={() =>
              onNavigate('setlists', {
                groupId: group.id,
                groupName: group.name,
                myRole: group.myRole,
              })
            }
          >
            <Text style={globalStyles.buttonText}>🎼 Setlists</Text>
          </TouchableOpacity>

          {canInvite && (
            <TouchableOpacity
              style={[globalStyles.button, styles.actionBtn]}
              onPress={() => setInviteModalVisible(true)}
            >
              <Text style={globalStyles.buttonText}>+ Invitar</Text>
            </TouchableOpacity>
          )}

          {canLeave && (
            <TouchableOpacity
              style={[globalStyles.buttonDanger, styles.actionBtn]}
              onPress={handleLeave}
            >
              <Text style={globalStyles.buttonText}>Abandonar</Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              style={[globalStyles.buttonDanger, styles.actionBtn]}
              onPress={handleDeleteGroup}
            >
              <Text style={globalStyles.buttonText}>Eliminar grupo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Miembros ({group.members.length})
        </Text>
        <FlatList
          data={group.members}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isMe = item.user.id === currentUser?.id;
            const isOwner = item.role === 'owner';
            return (
              <View style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {item.user.name} {isMe && <Text style={styles.meTag}>(tú)</Text>}
                  </Text>
                  <Text style={styles.memberEmail}>{item.user.email}</Text>
                  <Text style={styles.memberRole}>{ROLE_LABELS[item.role]}</Text>
                </View>

                <RowActions
                  onEdit={() => handleChangeRole(item)}
                  onDelete={() => handleRemoveMember(item)}
                  canEdit={canChangeRoles && !isOwner}
                  canDelete={canRemove && !isOwner}
                />
              </View>
            );
          }}
        />
      </ScrollView>

      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={globalStyles.title}>Invitar al grupo</Text>
            <Text style={globalStyles.subtitle}>
              Se enviará una invitación por correo
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Correo del invitado"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />

            <Text style={styles.label}>Rol al unirse</Text>
            <View style={styles.roleGrid}>
              {(['member', 'admin'] as const).map((r) => {
                const selected = r === inviteRole;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, selected && styles.roleChipSelected]}
                    onPress={() => setInviteRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selected && styles.roleChipTextSelected,
                      ]}
                    >
                      {r === 'admin' ? '⭐ Admin' : '🎵 Miembro'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[globalStyles.buttonDanger, styles.modalBtn]}
                onPress={() => setInviteModalVisible(false)}
                disabled={inviting}
              >
                <Text style={globalStyles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, styles.modalBtn]}
                onPress={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={globalStyles.buttonText}>Enviar invitación</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    loadingWrap: { alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 24, paddingTop: 48 },
    header: { marginBottom: 12 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
    groupHeader: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    groupLogo: {
      width: 120,
      height: 120,
      borderRadius: 16,
      marginBottom: 12,
    },
    logoPlaceholder: {
      backgroundColor: c.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoPlaceholderText: { fontSize: 48 },
    groupName: { color: c.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
    groupType: { color: c.accent, fontSize: 14, fontWeight: '600', marginTop: 4 },
    groupDescription: {
      color: c.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 8,
    },
    myRoleBadge: {
      marginTop: 12,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 9999,
      color: c.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    actionBtn: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 150,
      minWidth: 150,
      paddingVertical: 12,
    },  
    sectionTitle: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    memberRow: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    memberInfo: { flex: 1 },
    memberName: { color: c.text, fontSize: 15, fontWeight: '700' },
    meTag: { color: c.accent, fontSize: 12, fontWeight: '400' },
    memberEmail: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    memberRole: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    memberActions: { flexDirection: 'row', gap: 6 },
    iconBtn: {
      backgroundColor: c.surface2,
      borderRadius: 8,
      padding: 8,
      minWidth: 36,
      alignItems: 'center',
    },
    deleteBtn: { backgroundColor: 'rgba(220, 53, 69, 0.15)' },
    iconBtnText: { fontSize: 14 },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: 24,
    },
    modal: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
    },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 12,
      marginBottom: 6,
    },
    roleGrid: { flexDirection: 'row', gap: 8 },
    roleChip: {
      flex: 1,
      backgroundColor: c.surface2,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    roleChipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    roleChipText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    roleChipTextSelected: { color: '#FFFFFF' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    modalBtn: { flex: 1 },
  });