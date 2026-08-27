// ============================================================
// PAGINATION BAR — paginación estándar
// ============================================================
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function PaginationBar({ page, totalPages, onPrev, onNext }: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  if (totalPages <= 1) return null;
  return (
    <View style={s.root}>
      <TouchableOpacity
        style={[s.btn, page === 1 && s.btnDisabled]}
        onPress={onPrev}
        disabled={page === 1}
      >
        <Ionicons name="chevron-back-outline" size={18} color={page === 1 ? c.textMuted : c.text} />
        <Text style={[s.btnText, page === 1 && s.btnTextDisabled]}>Anterior</Text>
      </TouchableOpacity>
      <Text style={s.info}>
        Página {page} de {totalPages}
      </Text>
      <TouchableOpacity
        style={[s.btn, page === totalPages && s.btnDisabled]}
        onPress={onNext}
        disabled={page === totalPages}
      >
        <Text style={[s.btnText, page === totalPages && s.btnTextDisabled]}>Siguiente</Text>
        <Ionicons name="chevron-forward-outline" size={18} color={page === totalPages ? c.textMuted : c.text} />
      </TouchableOpacity>
    </View>
  );
}

const buildStyles = (c: any) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      gap: 8,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.surface2,
      borderRadius: 9999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: c.text, fontSize: 13, fontWeight: '600' },
    btnTextDisabled: { color: c.textMuted },
    info: { color: c.textSecondary, fontSize: 13 },
  });