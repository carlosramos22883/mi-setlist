// ============================================================
// SCREEN HEADER — encabezado estándar de toda pantalla
// ============================================================
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function ScreenHeader({ title, subtitle, onBack }: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  return (
    <View style={s.root}>
      {onBack && (
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color={c.text} />
        </TouchableOpacity>
      )}
      <View style={s.textWrap}>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const buildStyles = (c: any) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    backBtn: { padding: 4 },
    textWrap: { flex: 1 },
    title: { fontSize: 24, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
  });