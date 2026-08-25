// ============================================================
// DECORATOR @Permissions
// ============================================================
// "Etiqueta" una ruta con los permisos que requiere.
// Ejemplo de uso en un controller:
//   @Permissions('users.create')
//   @Post()
//   create() { ... }
//
// Internamente guarda los permisos como metadata de la ruta
// para que el PermissionsGuard los lea después.
import { SetMetadata } from '@nestjs/common';

// Clave única donde guardamos los permisos en la metadata
export const PERMISSIONS_KEY = 'permissions';

// Decorador de fábrica: recibe una lista de permisos requeridos
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
