// ============================================================
// PASSWORD INPUT — campo de contraseña con "ojito" 👁
// ============================================================
// Lo reutilizamos en: AuthScreen, ResetPasswordScreen
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { colors, type Palette } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function PasswordInput({ label, error, style, ...inputProps }: Props) {
  // Estado local del ojito: cuando es true, se ve el texto plano
  const [visible, setVisible] = useState(false);

  const { c, g: globalStyles } = useTheme();
  const styles = buildStyles(c);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={!visible} // si no es visible, oculta caracteres
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.eye}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {/* Emoji como icono. En el futuro usaremos @expo/vector-icons */}
          <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      {error !== undefined && error !== '' && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const buildStyles = (c: Palette) => StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { color: c.textSecondary, fontSize: 12, marginBottom: 4, marginLeft: 4 },
  box: {
    flexDirection: 'row', // input y ojo en la misma fila
    alignItems: 'center',
    backgroundColor: c.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  boxError: { borderColor: colors.status.dangerDark },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.text,
  },
  eye: { paddingHorizontal: 12 },
  eyeIcon: { fontSize: 18 },
  error: { color: colors.status.dangerDark, fontSize: 12, marginTop: 4, marginLeft: 4 },
});