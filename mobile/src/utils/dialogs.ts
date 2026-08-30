// ============================================================
// DIALOGS — helpers de alert/confirm multiplataforma
// ============================================================
// Web: SweetAlert2 (tematizado y por encima de los modales)
// iOS/Android: Alert.alert nativo
import { Alert, Platform } from 'react-native';
import Swal from 'sweetalert2';

// 🆕 ¿Modo oscuro activo? (el ThemeContext lo persiste en localStorage)
function isDarkMode(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
  return (window.localStorage.getItem('ms_theme') ?? 'dark') === 'dark';
}

// 🆕 Colores base según el tema activo (misma paleta que theme.ts)
// 🆕 Colores base según el tema activo (misma paleta que theme.ts)
function themeOptions() {
  return isDarkMode()
    ? {
        background: '#161426',         // surface (dark)
        color: '#F5F4FA',              // text (dark)
        confirmButtonColor: '#8B5CF6', // primary (dark)
        cancelButtonColor: '#3A3752',
        backdrop: 'rgba(12, 10, 22, 0.8)', // 🆕 velo oscuro sobre la app oscura
      }
    : {
        background: '#FFFFFF',
        color: '#14122B',
        confirmButtonColor: '#7C3AED',
        cancelButtonColor: '#6E6C82',
        backdrop: 'rgba(20, 18, 43, 0.45)', // 🆕 velo suave sobre la app clara
      };
}

export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    Swal.fire({
      ...themeOptions(),
      title,
      text: message,
      icon: 'info',
      confirmButtonText: 'Aceptar',
    });
  } else {
    Alert.alert(title, message);
  }
}

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
) {
  if (Platform.OS === 'web') {
    Swal.fire({
      ...themeOptions(),
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) onConfirm();
    });
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: onConfirm },
    ]);
  }
}

export function showError(title: string, message: string) {
  if (Platform.OS === 'web') {
    Swal.fire({
      ...themeOptions(),
      confirmButtonColor: '#DC3545', // danger gana al tema
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  } else {
    Alert.alert(title, message);
  }
}

export function showSuccess(title: string, message: string) {
  if (Platform.OS === 'web') {
    Swal.fire({
      ...themeOptions(),
      confirmButtonColor: '#0B6E4F', // success gana al tema
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
  } else {
    Alert.alert(title, message);
  }
}