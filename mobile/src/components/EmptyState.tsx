// ============================================================
// EMPTY STATE — estado vacío estándar
// ============================================================
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function EmptyState({ message, icon = 'folder-open-outline' }: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  return (
    <View style={s.root}>
      <Ionicons name={icon} size={48} color={c.textMuted} />
      <Text style={s.message}>{message}</Text>
    </View>
  );
}

const buildStyles = (c: any) =>
  StyleSheet.create({
    root: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    message: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
  });