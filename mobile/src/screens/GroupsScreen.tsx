// ============================================================
// GROUPS SCREEN — lista de grupos con toolbar estándar
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as GroupsService from '../services/groups.service';
import type { Group } from '../services/groups.service';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { confirmAction, showAlert } from '../utils/dialogs';
import ScreenHeader from '../components/ScreenHeader';
import ListToolbar from '../components/ListToolbar';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import RowActions from '../components/RowActions';
import GroupFormModal from '../components/GroupFormModal';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api/v1';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

const TYPE_LABELS: Record<string, string> = {
  band: 'Banda', choir: 'Coro', orchestra: 'Orquesta',
  vocal_group: 'Grupo vocal', other: 'Otro',
};
const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño', admin: 'Admin', member: 'Miembro',
};

export default function GroupsScreen({ onNavigate }: Props) {
  const { can } = useAuth();
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<Group['type']>('band');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GroupsService.listMyGroups({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setGroups(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (e: any) {
      showAlert('Error', e?.response?.data?.message ?? 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  function onRefresh() {
    setRefreshing(true);
    loadGroups();
  }

  function handleSearch(text: string) {
    setSearch(text);
    setPage(1);
  }

  // Abrir modal de edición con los datos del grupo
  function openEdit(group: Group) {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description ?? '');
    setEditType(group.type);
    setModalVisible(true);
  }

  // Eliminar con confirmación estándar (solo owner)
  function handleDelete(group: Group) {
    confirmAction(
      'Eliminar grupo',
      `¿Eliminar "${group.name}"? Esta acción lo desactivará.`,
      async () => {
        try {
          await GroupsService.deleteGroup(group.id);
          showAlert('Éxito', 'Grupo eliminado');
          loadGroups();
        } catch (e: any) {
          showAlert('Error', e?.response?.data?.message ?? 'No se pudo eliminar');
        }
      },
    );
  }

  function renderGroup({ item }: { item: Group }) {
  const logoUrl = item.logoPath ? `${API_URL}/${item.logoPath}` : null;
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => onNavigate('groupDetail', { groupId: item.id })}
        activeOpacity={0.7}
      >
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Text style={styles.logoPlaceholderText}>🎵</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.groupDescription} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.meta}>
            <Text style={styles.type}>{TYPE_LABELS[item.type]}</Text>
            <Text style={styles.role}>• {ROLE_LABELS[item.myRole]}</Text>
            <Text style={styles.members}>• {item.memberCount} miembros</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 🆕 acciones estándar, visibles según el rol en el grupo */}
      <RowActions
        onEdit={() => openEdit(item)}
        onDelete={() => handleDelete(item)}
        canEdit={can('groups.edit') && (item.myRole === 'owner' || item.myRole === 'admin')}
        canDelete={can('groups.delete') && item.myRole === 'owner'}
      />
    </View>
  );
}

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Mis grupos" subtitle="Grupos musicales donde participas" />

      <ListToolbar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Buscar grupo..."
        onCreate={can('groups.create') ? () => {
          setEditingGroup(null);
          setModalVisible(true);
        } : undefined}
        createLabel="+ Nuevo grupo"
      />

      {loading && groups.length === 0 ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState message="No perteneces a ningún grupo aún" icon="musical-notes-outline" />}
          scrollEnabled={false}
        />
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
      <GroupFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => loadGroups()}
        initialGroup={editingGroup}
        canSave={editingGroup ? can('groups.edit') : can('groups.create')}
      />
    </ScrollView>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: { padding: 24, paddingTop: 16 },
    loader: { marginTop: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    cardBody: { flex: 1, flexDirection: 'row' },
    logo: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
    logoPlaceholder: { backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    logoPlaceholderText: { fontSize: 32 },
    cardContent: { flex: 1 },
    groupName: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    groupDescription: { color: c.textSecondary, fontSize: 13, marginBottom: 8 },
    meta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
    type: { color: c.accent, fontSize: 12, fontWeight: '600' },
    role: { color: c.textSecondary, fontSize: 12 },
    members: { color: c.textSecondary, fontSize: 12 },
  });