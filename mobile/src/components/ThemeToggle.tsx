// ============================================================
// THEME TOGGLE — el ÚNICO botón claro/oscuro del sistema
// ============================================================
// Cámbialo aquí y se actualiza en la topbar Y en las pantallas
// de auth. La prop `floating` solo decide la ubicación.
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  /** true = anclado en la esquina (pantallas sin topbar) */
  floating?: boolean;
  size?: number;
}

export default function ThemeToggle({ floating = false, size = 22 }: Props) {
  const { mode, toggleMode, c } = useTheme();
  return (
    <TouchableOpacity
      style={floating ? styles.floating : styles.inline}
      onPress={toggleMode}
    >
      <Ionicons
        name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
        size={size}
        color={c.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floating: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  inline: { padding: 6 },
});