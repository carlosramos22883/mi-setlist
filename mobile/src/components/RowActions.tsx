// ============================================================
// ROW ACTIONS — botones de editar/eliminar para filas de lista
// ============================================================
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../constants/theme';

interface Props {
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function RowActions({ onEdit, onDelete, canEdit = true, canDelete = true }: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  if (!canEdit && !canDelete) return null;
  return (
    <View style={s.root}>
      {canEdit && onEdit && (
        <TouchableOpacity style={s.btn} onPress={onEdit}>
          <Text style={s.icon}>✏️</Text>
        </TouchableOpacity>
      )}
      {canDelete && onDelete && (
        <TouchableOpacity style={[s.btn, s.deleteBtn]} onPress={onDelete}>
          <Text style={s.icon}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const buildStyles = (c: any) =>
  StyleSheet.create({
    root: { flexDirection: 'row', gap: 8 },
    btn: {
      backgroundColor: c.surface2,
      borderRadius: 8,
      padding: 8,
      minWidth: 40,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    deleteBtn: { backgroundColor: 'rgba(220, 53, 69, 0.15)' },
    icon: { fontSize: 16 },
  });