// ============================================================
// API — cliente HTTP (axios) configurado una sola vez
// ============================================================
import axios from 'axios';
import { API_URL } from '../constants/config';
import { getTokens, saveTokens, clearTokens } from './storage';
import * as AuthService from './auth.service';

// Instancia pre-configurada
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// INTERCEPTOR de petición: adjunta Bearer token
api.interceptors.request.use(async (config) => {
  // 🆕 Si el body es FormData (uploads), NO forzar JSON
  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData;

  if (isFormData) {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  // Adjuntar access token si existe
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// INTERCEPTOR de respuesta: si 401, intenta refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await getTokens();
        if (!refreshToken) throw new Error('No refresh token');

        const { accessToken, refreshToken: newRefresh } =
          await AuthService.refresh(refreshToken);
        await saveTokens(accessToken, newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);