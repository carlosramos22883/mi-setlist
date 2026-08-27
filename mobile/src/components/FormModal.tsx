// ============================================================
// FORM MODAL — modal estándar para crear/editar
// ============================================================
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  submitLabel?: string;
  onSubmit?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export default function FormModal({
  visible,
  onClose,
  title,
  submitLabel = 'Guardar',
  onSubmit,
  loading = false,
  children,
}: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.title}>{title}</Text>
          <ScrollView style={s.body} contentContainerStyle={s.bodyInner}>
            {children}
          </ScrollView>
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, s.cancelBtn]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            {onSubmit && (
              <TouchableOpacity
                style={[s.btn, s.submitBtn]}
                onPress={onSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.submitText}>{submitLabel}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const buildStyles = (c: any) =>
  StyleSheet.create({
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
      borderWidth: 1,
      borderColor: c.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    body: { maxHeight: 500 },
    bodyInner: { padding: 20 },
    actions: {
      flexDirection: 'row',
      gap: 10,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    btn: { flex: 1, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' },
    cancelBtn: { backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border },
    cancelText: { color: c.text, fontSize: 14, fontWeight: '600' },
    submitBtn: { backgroundColor: c.primary },
    submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  });