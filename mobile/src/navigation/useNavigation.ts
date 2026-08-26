// ============================================================
// NAVIGATION — estado global de qué pantalla mostrar
// ============================================================
// Por ahora usamos un "navegador manual": una variable global
// que dice qué pantalla está activa. Más adelante lo migramos
// a Expo Router cuando tengamos muchos módulos.
import { useState, useCallback } from 'react';

// Las pantallas que existen en la app
export type ScreenName =
  | 'auth'           // login / registro
  | 'forgot'         // pedir reset de contraseña
  | 'reset'          // nueva contraseña (con token)
  | 'home'          // usuario logueado
  | 'profile'       // perfil del usuario 
  | 'usersAdmin'    // crud de usuarios
  | 'rolesAdmin';   // crud de roles 

export function useNavigation(initial: ScreenName = 'auth') {
  const [screen, setScreen] = useState<ScreenName>(initial);
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = useCallback((to: ScreenName, newParams: Record<string, string> = {}) => {
    setScreen(to);
    setParams(newParams);
  }, []);

  return { screen, params, navigate };
}