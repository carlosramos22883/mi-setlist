// ============================================================
// CONFIGURACIÓN DE CONEXIÓN CON LA API
// ============================================================
import { Platform } from 'react-native';

// Cada plataforma "ve" a tu Mac de forma distinta:
//  - web y simulador iOS: localhost funciona directo
//  - emulador Android: localhost es el propio emulador, por eso 10.0.2.2
//  - celular físico: necesitas la IP local de tu Mac (ej: 192.168.1.20)
function getApiUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1'; // emulador Android
  }
  return 'http://localhost:3000/api/v1'; // web / iOS
  // 👉 Si pruebas en CELULAR FÍSICO, cambia localhost por tu IP local
}

export const API_URL = getApiUrl();