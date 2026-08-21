// ============================================================
// SISTEMA DE DISEÑO - MI SETLIST
// ============================================================
// La ÚNICA fuente de verdad de colores.
// Si cambias un hex aquí, toda la app se actualiza.

export const colors = {
  // Colores de marca (nacen del logo)
  brand: {
    purple: '#7C3AED',
    indigo: '#4F46E5',
    blue: '#2563EB',
    cyan: '#0EA5E9',
  },

  // ☀️ Modo claro
  light: {
    bg: '#F6F7FB',          // fondo general
    surface: '#FFFFFF',     // cards / modales
    surface2: '#EEF0F8',    // inputs, chips
    border: '#E4E4F0',
    text: '#14122B',        // texto principal
    textSecondary: '#5D5A72',
    textMuted: '#8B88A0',   // placeholders
    primary: '#6D28D9',     // botones principales
    primaryHover: '#5B21B6',
    primarySoft: '#EDE9FE', // fondo de badges
    accent: '#0284C7',      // links y detalles
    accentSoft: '#E0F2FE',
  },

  // 🌙 Modo oscuro
  dark: {
    bg: '#0C0A16',
    surface: '#161426',
    surface2: '#1E1B33',
    border: '#2A2740',
    text: '#F5F4FA',
    textSecondary: '#A5A3B8',
    textMuted: '#6E6C82',
    primary: '#8B5CF6',
    primaryHover: '#A78BFA',
    primarySoft: '#2A2145',
    accent: '#38BDF8',
    accentSoft: '#10293C',
  },

  // 🚦 Estados
  status: {
    success: '#0B6E4F',
    successDark: '#34D399',
    warning: '#F59E0B',
    warningDark: '#FBBF24',
    danger: '#DC3545',
    dangerDark: '#F87171',
    info: '#3B82F6',
    infoDark: '#60A5FA',
  },
} as const; // "as const" = valores inmutables y tipados al máximo