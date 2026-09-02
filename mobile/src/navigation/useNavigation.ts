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
  | 'rolesAdmin'   // crud de roles 
  | 'groups'        // crud de grupos
  | 'createGroup'   // crear grupo
  | 'groupDetail'  // detalle de grupo
  | 'songs'        //crud canciones
  | 'songDetail'   //detalle de canción
  | 'setlists'        //crud setlist
  | 'setlistDetail'  //detalle de setlist
  | 'events'       // crud setlist 
  | 'eventDetail'; // detalle de evento


export function useNavigation(initial: ScreenName = 'auth') {
  const [screen, setScreen] = useState<ScreenName>(initial);
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = useCallback((to: ScreenName, p?: Record<string, any>) => {
    setScreen(to);
    setParams(p ?? {});
  }, []);

  return { screen, params, navigate };
}