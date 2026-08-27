// ============================================================
// THEME CONTEXT — modo claro/oscuro con persistencia
// ============================================================
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { colors, type Palette } from '../constants/theme';
import { buildGlobalStyles } from '../styles/global';

type Mode = 'dark' | 'light';

interface ThemeValue {
  mode: Mode;
  toggleMode: () => void;
  c: Palette; // paleta activa (colores)
  g: ReturnType<typeof buildGlobalStyles>; // estilos globales activos
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return (window.localStorage.getItem('ms_theme') as Mode) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (Platform.OS === 'web') window.localStorage.setItem('ms_theme', mode);
  }, [mode]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
      c: colors[mode],
      g: buildGlobalStyles(colors[mode]),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}