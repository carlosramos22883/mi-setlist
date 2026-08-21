// ============================================================
// API — cliente HTTP (axios) configurado una sola vez
// ============================================================
import axios from 'axios';
import { API_URL } from '../constants/config';
import { getTokens } from './storage';

// "Instancia" de axios = un axios pre-configurado (URL base, headers)
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// INTERCEPTOR de petición: antes de CADA request,
// si hay un access token guardado, lo adjunta como Bearer.
// (Es el equivalente móvil a enviar el cookie de sesión en Laravel)
api.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});