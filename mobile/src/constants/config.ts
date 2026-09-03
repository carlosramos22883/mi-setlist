// ============================================================
// CONFIG — conexión a la API según la plataforma
// ============================================================
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiUrl(): string {
  // Web: el navegador llega directo a tu Maquina por localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api/v1';
  }

  // Móvil: reutilizamos la IP con la que Metro te sirve la app.
  //  - Celular físico:  "192.168.1.20:8082" → usa 192.168.1.20
  //  - Emulador Android: "10.0.2.2:8082"   → usa 10.0.2.2
  const hostUri = Constants.expoConfig?.hostUri ?? 'localhost:8082';
  const ip = hostUri.split(':')[0];
  return `http://${ip}:3000/api/v1`;
}

export const API_URL = getApiUrl();