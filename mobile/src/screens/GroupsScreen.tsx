// ============================================================
// GROUPS SCREEN — lista de grupos del usuario
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as GroupsService from '../services/groups.service';
import type { Group } from '../services/groups.service';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { showAlert } from '../utils/dialogs';

const API_URL = 'http://localhost:3000/api/v1';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

const TYPE_LABELS: Record<string, string> = {
  band: 'Banda',
  choir: 'Coro',
  orchestra: 'Orquesta',
  vocal_group: 'Grupo vocal',
  other: 'Otro',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  member: 'Miembro',
};

export default function GroupsScreen({ onNavigate }: Props) {
  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);
  const { can } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GroupsService.listMyGroups({ page, limit: 10 });
      setGroups(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (e: any) {
      showAlert('Error', e?.response?.data?.message ?? 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  function onRefresh() {
    setRefreshing(true);
    loadGroups();
  }

  function renderGroup({ item }: { item: Group }) {
    const logoUrl = item.logoPath ? `${API_URL}/${item.logoPath}` : null;
    return (
      <TouchableOpacity
        style={styles.card}
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
            <Text style={styles.groupDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.meta}>
            <Text style={styles.type}>{TYPE_LABELS[item.type]}</Text>
            <Text style={styles.role}>• {ROLE_LABELS[item.myRole]}</Text>
            <Text style={styles.members}>• {item.memberCount} miembros</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={globalStyles.title}>Mis grupos</Text>
          <Text style={globalStyles.subtitle}>
            Grupos musicales donde participas
          </Text>
        </View>

        {loading && groups.length === 0 ? (
          <ActivityIndicator color={c.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                No perteneces a ningún grupo aún
              </Text>
            }
            scrollEnabled={false}
          />
        )}

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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => onNavigate('createGroup')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 80 },
  header: { marginBottom: 16 },
  loader: { marginTop: 40 },
  empty: { color: c.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: c.border,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  logoPlaceholder: {
    backgroundColor: c.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: { fontSize: 32 },
  cardContent: { flex: 1 },
  groupName: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  groupDescription: { color: c.textSecondary, fontSize: 13, marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  type: { color: c.accent, fontSize: 12, fontWeight: '600' },
  role: { color: c.textSecondary, fontSize: 12 },
  members: { color: c.textSecondary, fontSize: 12 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  pageBtn: { flex: 1 },
  pageInfo: { color: c.textSecondary, fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4, // sombra en Android; en web se ignora sin warning
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: -2 },
});