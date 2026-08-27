// ============================================================
// LIST TOOLBAR — búsqueda + controles + botón "+ Nuevo"
// ============================================================
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  search: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode; // controles extra (checkboxes, filtros)
  onCreate?: () => void; // si se pasa, muestra el botón "+ Nuevo"
  createLabel?: string;
}

export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  children,
  onCreate,
  createLabel = '+ Nuevo',
}: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  return (
    <View style={s.root}>
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={c.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={onSearchChange}
        />
      </View>
      {children}
      {onCreate && (
        <TouchableOpacity style={s.createBtn} onPress={onCreate}>
          <Text style={s.createBtnText}>{createLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const buildStyles = (c: any) =>
  StyleSheet.create({
    root: { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      color: c.text,
      fontSize: 14,
    },
    createBtn: {
      backgroundColor: c.primary,
      borderRadius: 9999,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  });