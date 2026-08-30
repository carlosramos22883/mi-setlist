// ============================================================
// GLOBAL STYLES — el "app.css" de Mi SetList
// ============================================================
// Estilos reutilizables por TODAS las pantallas.
// Si mañana cambias el botón, lo cambias AQUÍ y toda la app se actualiza.
import { StyleSheet } from 'react-native';
import { colors, type Palette } from '../constants/theme';

export const buildGlobalStyles = (c: Palette) =>
  StyleSheet.create({
  // --- Layout ---
  screen: { flex: 1, backgroundColor: c.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },

  // --- Encabezado de marca ---
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: c.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 24 },

  // --- Contenedores ---
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 20 },

  // --- Formularios ---
  input: {
    backgroundColor: c.surface2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  error: { color: colors.status.dangerDark, marginBottom: 10, textAlign: 'center' },

  // --- Botones ---
  button: {
    backgroundColor: c.primary,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: colors.status.danger,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },

  // --- Enlaces ---
  link: { color: c.accent, fontSize: 13, textAlign: 'center' },

  // --- Badges ---
  badge: { backgroundColor: c.primarySoft, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { color: c.primary, fontSize: 12, fontWeight: '600' },  
});
// Compatibilidad: pantallas aún no migradas siguen usando el dark
export const globalStyles = buildGlobalStyles(colors.dark);