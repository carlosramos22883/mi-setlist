// ============================================================
// STORAGE — guardado seguro de tokens
// ============================================================
// En móvil usamos SecureStore (el "llavero" encriptado del teléfono).
// En web usamos localStorage (SecureStore no existe en navegador).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'misetlist_access_token';
const REFRESH_KEY = 'misetlist_refresh_token';

// Adaptador interno: elige el almacenamiento según la plataforma
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// API pública: el resto de la app usa estas 3 funciones
export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    storage.getItem(ACCESS_KEY),
    storage.getItem(REFRESH_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    storage.setItem(ACCESS_KEY, accessToken),
    storage.setItem(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([storage.removeItem(ACCESS_KEY), storage.removeItem(REFRESH_KEY)]);
}