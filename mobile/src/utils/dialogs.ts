// ============================================================
// DIALOGS — alertas y confirmaciones multiplataforma
// ============================================================
// En WEB usamos las APIs nativas del navegador (window.alert /
// window.confirm). En MÓVIL nativo usamos Alert de React Native.
// Así ninguna pantalla vuelve a sufrir el "Alert silencioso en web".
import { Alert, Platform } from 'react-native';

// Alerta informativa (un solo botón para cerrar)
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

// Confirmación con callback: se ejecuta onConfirm si el usuario acepta
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Aceptar', style: 'destructive', onPress: onConfirm },
  ]);
}