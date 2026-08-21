// ============================================================
// AUTH CONTEXT — la "memoria de sesión" de toda la app
// ============================================================
// Cualquier pantalla puede usar useAuth() para saber quién es el
// usuario, loguearlo, registrarlo o desloguearlo.
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as AuthService from '../services/auth.service';
import type { AuthUser } from '../services/auth.service';
import { clearTokens, getTokens, saveTokens } from '../services/storage';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean; // true mientras revisamos si hay sesión guardada
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Hook personalizado: useAuth() desde cualquier componente
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app: intentar restaurar la sesión guardada
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const { accessToken, refreshToken } = await getTokens();
      if (!accessToken || !refreshToken) return; // nunca hubo sesión

      try {
        // Intento 1: con el access token guardado
        setUser(await AuthService.me());
      } catch {
        // Access token expirado → rotamos con el refresh token
        const tokens = await AuthService.refresh(refreshToken);
        await saveTokens(tokens.accessToken, tokens.refreshToken);
        setUser(await AuthService.me());
      }
    } catch {
      // Sesión inválida: limpiamos y quedamos como "no logueado"
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await AuthService.login(email, password);
    await saveTokens(res.accessToken, res.refreshToken);
    setUser(res.user); // ← esto hace que la app cambie de pantalla sola
  }

  async function register(name: string, email: string, password: string) {
    const res = await AuthService.register(name, email, password);
    await saveTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }

  async function logout() {
    try {
      const { refreshToken } = await getTokens();
      await AuthService.logout(refreshToken); // revoca en el backend
    } catch {
      // Si la API falla, igual salimos localmente
    }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}