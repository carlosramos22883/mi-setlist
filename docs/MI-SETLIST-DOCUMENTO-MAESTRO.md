# MI SETLIST - DOCUMENTO MAESTRO  
  
**Última actualización:** Agosto 2026 (Bloques A y B completados)
**Estado:** Fase 1 - Autenticación y RBAC completos
  
---  
  
## 1. OBJETIVO DEL SISTEMA  
  
### 1.1 Descripción  
**Mi SetList** es una plataforma multiplataforma (iOS, Android y Web) diseñada para músicos, coros, bandas y grupos musicales que necesitan organizar, compartir y consultar su repertorio de canciones de manera colaborativa.  
  
### 1.2 Problema que resuelve  
Los músicos suelen tener su repertorio disperso en múltiples lugares: WhatsApp, Google Drive, PDFs, fotos de partituras, notas personales, etc. Esto genera desorganización, dificultad para colaborar con otros músicos y problemas al momento de preparar presentaciones.  
  
### 1.3 Solución  
Una aplicación centralizada que permite:  
- Gestionar canciones con letra, acordes, notas personales y archivos asociados.  
- Crear y administrar grupos musicales (coros, bandas, orquestas, etc.).  
- Organizar eventos y conciertos con ubicación geográfica.  
- Crear setlists personalizados para cada presentación.  
- Colaborar en tiempo real con otros miembros del grupo.  
- Consultar el repertorio durante presentaciones con un "Modo Escenario" optimizado.  
- Exportar repertorios a PDF para imprimir o compartir.  
  
### 1.4 Propósito adicional  
Servir como proyecto estrella del portafolio profesional, demostrando habilidades avanzadas en:  
- Desarrollo backend con Node.js y arquitectura enterprise (NestJS).  
- Desarrollo móvil multiplataforma con React Native.  
- Diseño de bases de datos relacionales complejas.  
- Implementación de autenticación robusta y autorización granular.  
- Integración de mapas, subida de archivos y generación de PDFs.  
- Buenas prácticas: TypeScript, Docker, tests, CI/CD.  
  
---  
  
## 2. ARQUITECTURA TÉCNICA  
  
### 2.1 Stack Tecnológico  
  
#### Backend  
- **Runtime:** Node.js (LTS)  
- **Lenguaje:** TypeScript  
- **Framework:** NestJS (arquitectura enterprise similar a Laravel)  
- **ORM:** Prisma  
- **Base de datos:** PostgreSQL 16  
- **Autenticación:** JWT + Refresh Tokens + Passport  
- **OAuth:** Google OAuth 2.0  
- **Hashing:** bcrypt  
- **Validación:** class-validator + class-transformer  
- **Email:** Nodemailer (con Mailpit en desarrollo)  
- **Upload de archivos:** Cloudinary / S3 compatible  
- **Generación de PDF:** PDFKit / Puppeteer  
  
#### Frontend Móvil y Web  
- **Framework:** React Native con Expo  
- **Lenguaje:** TypeScript  
- **Navegación:** Expo Router  
- **Estado global:** Zustand  
- **Data fetching:** TanStack Query (React Query)  
- **Formularios:** React Hook Form + Zod  
- **Mapas:** react-native-maps  
- **Almacenamiento seguro:** expo-secure-store  
- **Estilos:** NativeWind (Tailwind para React Native)  
- **Plataformas:** iOS, Android y Web  
  
#### Infraestructura  
- **Contenedores:** Docker + Docker Compose  
- **Base de datos:** PostgreSQL 16 (Docker)  
- **Email local:** Mailpit (Docker)  
- **Cache:** Redis (Docker, opcional)  
- **CI/CD:** GitHub Actions  
  
#### Herramientas de desarrollo  
- **Editor:** Visual Studio Code  
- **Pruebas móviles:** Expo Go (físico), iOS Simulator, Android Emulator  
- **Testing:** Jest (backend), React Native Testing Library (frontend)  
- **Linting:** ESLint + Prettier  
- **Documentación API:** Swagger (integrado en NestJS)  
  
### 2.2 Arquitectura general  
```  
┌─────────────────────────────────────────────────────┐  
│                    CLIENTES                         │  
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐     │  
│   │ iOS App  │  │ Android  │  │   Web App    │     │  
│   └────┬─────┘  └────┬─────┘  └──────┬───────┘     │  
│        └──────────────┼───────────────┘             │  
│                       ↓                             │  
│              ┌────────────────┐                     │  
│              │   Axios/API    │                     │  
│              │    Client      │                     │  
│              └────────┬───────┘                     │  
└───────────────────────┼─────────────────────────────┘  
                        ↓  
┌───────────────────────────────────────────────────────┐  
│                    BACKEND (NestJS)                  │  
│  ┌──────────────────────────────────────────────┐    │  
│  │ Controllers → Services → Prisma → Database   │    │  
│  ├──────────────────────────────────────────────┤    │  
│  │ Guards (Auth/Permissions)                    │    │  
│  │ Interceptors (Logging, Errors)               │    │  
│  │ Pipes (Validation)                           │    │  
│  └──────────────────────────────────────────────┘    │  
└───────────┬──────────────────────────┬────────────────┘  
            ↓                          ↓  
   ┌────────────────┐        ┌──────────────────┐  
   │  PostgreSQL    │        │   Cloudinary     │  
   │  (datos)       │        │   (archivos)     │  
   └────────────────┘        └──────────────────┘  
```  
  
### 2.3 Estrategia de autenticación  
- **Access Token (JWT):** corta duración (15 min), enviado en header `Authorization: Bearer <token>`.  
- **Refresh Token:** larga duración (7 días), almacenado en SecureStore (móvil) y HttpOnly Cookie (web).  
- **Rotación de tokens:** cada refresh genera nuevo access + nuevo refresh.  
- **Revocación:** tabla de refresh tokens en BD para permitir logout y revocación remota.  
  
---  
  
## 3. ROLES Y PERMISOS  
  
### 3.1 Roles del sistema  
| Rol | Permisos | Reglas especiales |
|-----|----------|-------------------|
| **Administrador** | TODOS los permisos del sistema | Nunca puede perder permisos. Nunca se puede eliminar. |
| **Usuario** | `profile.view`, `profile.edit` (perfil propio) | Todo rol debe tener ≥1 permiso. Asignado por defecto al registrarse. |
  
### 3.2 Roles dentro de un grupo  
Cada grupo musical tiene sus propios roles internos:  
  
| Rol | Permisos |  
|-----|----------|  
| **Owner** | Todo. Puede eliminar el grupo, transferir propiedad. |  
| **Admin** | Gestionar miembros, eventos, canciones, setlists. |  
| **Member** | Ver contenido, agregar notas personales, marcar favoritas. |  
| **Invited** | Pendiente de aceptar invitación. Solo puede aceptar/rechazar. |  
  
### 3.3 Permisos granulares (por recurso)  

**Administración del sistema (implementados en Bloque B):**
- `users.create`, `users.view`, `users.edit`, `users.delete`
- `roles.create`, `roles.view`, `roles.edit`, `roles.delete`
- `profile.view`, `profile.edit` (perfil propio)

**Recursos de dominio (pendientes, Bloques C-D):**
- `groups.create`, `groups.view`, `groups.edit`, `groups.delete`
- `songs.create`, `songs.view`, `songs.edit`, `songs.delete`
- `events.create`, `events.view`, `events.edit`, `events.delete`
- `setlists.create`, `setlists.view`, `setlists.edit`, `setlists.delete`
- `members.invite`, `members.remove`, `members.change_role`
  
### 3.4 Implementación técnica  
- **Backend:** Guards personalizados de NestJS (`@Permissions('songs.create')`). Implementados: `JwtAuthGuard` + `PermissionsGuard` + decorator `@Permissions`.
- **Frontend:** Context de Auth expone `can('permiso.nombre')` (equivalente móvil de `@can` en Laravel). Implementado en Bloque B2.
- **Verificación obligatoria:** el backend valida pertenencia al grupo en cada request. (Pendiente, Bloque C).
  
---  
  
## 4. MÓDULOS FUNCIONALES  
  
### 4.1 Autenticación y Usuarios  
- [x] Diseño conceptual
- [x] Registro de usuario (email + password, con verificación por correo)
- [x] Login con email/password (con política de contraseña fuerte)
- [ ] Login con Google OAuth
- [x] Verificación de correo electrónico (token de 24h)
- [x] Recuperación de contraseña (email con token de 1h)
- [x] Cambio de contraseña (al recuperar o editar perfil)
- [x] Refresh tokens y rotación (un solo uso)
- [x] Logout (revocación de tokens)
- [x] Perfil de usuario (editar nombre, correo, contraseña)
- [ ] Configuración (notificaciones, idioma, tema)

**Reglas implementadas:**
- Cambio de correo → revoca todas las sesiones + nuevo correo de verificación
- Login, register y /auth/me devuelven el mismo usuario enriquecido (con roles y permisos)
- Errores de validación en español, mostrados bajo cada campo en la UI  
  
### 4.2 Grupos Musicales  
- [ ] Crear grupo (coro, banda, orquesta, grupo vocal, otro)  
- [ ] Editar información del grupo  
- [ ] Subir imagen/logo del grupo  
- [ ] Invitar miembros por email o enlace  
- [ ] Aceptar/rechazar invitaciones  
- [ ] Gestión de miembros (cambiar roles, expulsar)  
- [ ] Abandonar grupo  
- [ ] Eliminar grupo (solo Owner)  
- [ ] Listar mis grupos  
- [ ] Feed de actividad del grupo  
  
### 4.3 Canciones  
- [ ] Crear canción  
- [ ] Campos: título, artista, autor, letra, tonalidad, BPM, duración, idioma, género  
- [ ] Categorías múltiples por canción  
- [ ] Estructura de acordes con posiciones en la letra  
- [ ] Notas generales de la canción  
- [ ] Notas personales por músico (privadas)  
- [ ] Subir imagen de portada  
- [ ] Subir archivos (PDF partitura, MP3 demo, etc.)  
- [ ] Marcar como favorita  
- [ ] Búsqueda avanzada (título, categoría, tonalidad, género)  
- [ ] Filtros por grupo y favoritos  
  
### 4.4 Eventos  
- [ ] Crear evento (nombre, descripción, fecha, hora)  
- [ ] Ubicación con coordenadas GPS  
- [ ] Visualización en mapa  
- [ ] Navegación a la ubicación (abrir Google/Apple Maps)  
- [ ] Asociar grupo al evento  
- [ ] Asociar setlist al evento  
- [ ] Editar/eliminar evento  
- [ ] Listar próximos eventos  
- [ ] Recordatorios (notificación 1 día antes, 1 hora antes)  
  
### 4.5 Setlists (Repertorios)  
- [ ] Crear setlist para un evento o independiente  
- [ ] Agregar canciones del repertorio del grupo  
- [ ] Reordenar canciones (drag & drop)  
- [ ] Configurar tonalidad específica por canción  
- [ ] Agregar notas específicas al setlist  
- [ ] Duración estimada total  
- [ ] Duplicar setlist existente  
- [ ] Compartir setlist (enlace público temporal)  
  
### 4.6 Modo Escenario / Presentación  
- [ ] Interfaz optimizada para tocar en vivo  
- [ ] Texto grande y alto contraste  
- [ ] Navegación anterior/siguiente con swipe  
- [ ] Visualización de letra + acordes  
- [ ] Auto-scroll configurable  
- [ ] Transposición de tonalidad en tiempo real  
- [ ] Indicador de canción actual / próxima  
- [ ] Pantalla completa (ocultar UI del sistema)  
  
### 4.7 Archivos y multimedia  
- [ ] Upload de imágenes (portadas, logos)  
- [ ] Upload de PDFs (partituras, letras impresas)  
- [ ] Upload de audio (MP3 demos)  
- [ ] Validación de tipos y tamaños  
- [ ] Generación de thumbnails  
- [ ] Almacenamiento en Cloudinary/S3  
- [ ] URLs firmadas con expiración  
  
### 4.8 Reportes y exportación  
- [ ] Generar PDF de setlist completo  
- [ ] Generar PDF de canción individual (letra + acordes + notas)  
- [ ] Exportar repertorio del grupo a PDF  
- [ ] Compartir PDF por WhatsApp, email, etc.  
  
### 4.9 Notificaciones  
- [ ] Notificaciones internas (en la app)  
- [ ] Push notifications (expo-notifications)  
- [ ] Email notifications (Nodemailer)  
- [ ] Tipos: invitaciones, nuevos eventos, cambios en setlist, recordatorios  
  
### 4.10 Dashboard  
- [ ] Resumen de actividad personal  
- [ ] Estadísticas (canciones, grupos, eventos)  
- [ ] Próximo evento destacado  
- [ ] Canciones más utilizadas  
- [ ] Actividad reciente de mis grupos  
  
### 4.11 Versión Web  
- [ ] Adaptación responsive con Expo Web  
- [ ] Mismas funcionalidades que móvil  
- [ ] PWA (instalable en navegador)  
  
---  
  
## 5. ESTADO ACTUAL DEL DESARROLLO  
  
## 5. ESTADO ACTUAL DEL DESARROLLO

### ✅ Completado

**Bloque A — Autenticación completa:**
- [x] Backend: política de contraseña fuerte (8+ chars, mayúscula, minúscula, número, símbolo)
- [x] Backend: errores en español por campo (ValidationPipe personalizado)
- [x] Backend: recuperación de contraseña con token por correo
- [x] Backend: logo servido por API (`/api/v1/public/logo`)
- [x] Backend: correos con plantilla de marca (header morado + botón redondeado)
- [x] Móvil: ojitos 👁 en campos de contraseña
- [x] Móvil: confirmación de contraseña en registro
- [x] Móvil: errores mostrados bajo cada campo
- [x] Móvil: logo en todas las pantallas
- [x] Móvil: pantallas de "olvidé contraseña" y "restablecer contraseña"

**Bloque B — RBAC y administración:**
- [x] Backend: modelo users ↔ roles ↔ permissions (estilo Spatie)
- [x] Backend: seeder con roles Administrador y Usuario
- [x] Backend: decorator `@Permissions` y `PermissionsGuard`
- [x] Backend: CRUD completo de usuarios con permisos
- [x] Backend: CRUD completo de roles con permisos (crear, editar, eliminar)
- [x] Backend: reglas de seguridad (admin intocable, roles nunca vacíos)
- [x] Backend: re-verificación de correo al cambiar email
- [x] Móvil: Context con `can()` para mostrar/ocultar UI según permisos
- [x] Móvil: Home con secciones condicionales (Administración solo si tiene permisos)
- [x] Móvil: pantalla de perfil propia
- [x] Móvil: panel de administración de usuarios (CRUD con búsqueda, paginación, confirmación)
- [x] Móvil: panel de gestión de roles (CRUD con checkboxes agrupados)
- [x] Móvil: helper de diálogos multiplataforma (`showAlert`, `confirmAction`)

### 🔄 En Progreso
- Ninguno actualmente

### ⏳ Pendiente

**Paso 5 — Grupos musicales (Bloque C):**
- [ ] Modelo `Group` con ownerId y tipo (coro, banda, orquesta, grupo vocal, otro)
- [ ] Modelo `GroupMember` con roles Owner/Admin/Member
- [ ] Modelo `Invitation` para invitaciones por email o enlace
- [ ] Endpoints de gestión de grupos (crear, editar, eliminar)
- [ ] Endpoints de miembros (invitar, aceptar, rechazar, expulsar, cambiar rol)
- [ ] Pantalla móvil "Mis grupos" + detalle de grupo

**Paso 6 — Setlists y canciones (Bloque D):**
- [ ] Modelo `Song` con letra, acordes, tonalidad, BPM, archivos
- [ ] Modelo `Setlist` con orden de canciones
- [ ] Modelo `SongCategory` y pivot
- [ ] Modelo `SongNote` (notas personales por músico)
- [ ] Modelo `FavoriteSong`
- [ ] Endpoints CRUD de canciones y setlists
- [ ] Pantallas móviles correspondientes

**Paso 7 — Reproductor de audio (Bloque E):**
- [ ] `expo-av` para reproducción
- [ ] Subida de archivos (S3 / almacenamiento local)
- [ ] Controles de reproducción integrados

**Paso 8 — Modo offline (Bloque F):**
- [ ] Cache con AsyncStorage
- [ ] Cola de sincronización al recuperar conexión

**Paso 9 — Calidad y despliegue (Bloque G):**
- [ ] Tests backend (Vitest) y móvil (Jest)
- [ ] Dockerfile multi-stage para la API
- [ ] Deploy web en Vercel
- [ ] Builds iOS/Android con EAS
- [ ] CI/CD con GitHub Actions
  
---  
  
## 6. PRÓXIMOS PASOS INMEDIATOS  
  
1. **Limpiar** la configuración anterior del proyecto.  
2. **Instalar** Docker Desktop (si no está instalado).  
3. **Verificar** versiones de Node.js y npm.  
4. **Crear** `docker-compose.yml` con PostgreSQL + Mailpit + Redis.  
5. **Inicializar** backend NestJS dentro de carpeta `api/`.  
6. **Inicializar** frontend Expo dentro de carpeta `mobile/`.  
7. **Configurar** Prisma y conectar a PostgreSQL.  
8. **Implementar** módulo de autenticación (registro, login, JWT, refresh tokens).  
9. **Crear** pantallas básicas de login/registro en React Native.  
10. **Conectar** frontend con backend para autenticación.  
  
---  
  
## 7. ESTRUCTURA DE BASE DE DATOS (borrador inicial)  
  
### Tablas principales  
  
```  
### Tablas implementadas (Bloques A y B)

roles
├── id (uuid, PK)
├── name (string, unique)
├── description (text, nullable)
├── created_at
└── updated_at

permissions
├── id (uuid, PK)
├── name (string, unique)  ← formato: "recurso.accion"
├── group (string)  ← "users", "roles", "profile"
├── description (text, nullable)
└── created_at

user_roles (tabla pivote)
├── user_id (FK → users)
├── role_id (FK → roles)
├── created_at
└── PK(user_id, role_id)

role_permissions (tabla pivote)
├── role_id (FK → roles)
├── permission_id (FK → permissions)
├── created_at
└── PK(role_id, permission_id)

email_verification_tokens
├── id (uuid, PK)
├── user_id (FK → users, ON DELETE CASCADE)
├── token_hash (string, unique)  ← SHA-256
├── expires_at (timestamp)
├── used_at (timestamp, nullable)
└── created_at

password_reset_tokens
├── id (uuid, PK)
├── user_id (FK → users, ON DELETE CASCADE)
├── token_hash (string, unique)  ← SHA-256
├── expires_at (timestamp)
├── used_at (timestamp, nullable)
└── created_at
  
groups  
├── id (uuid, PK)  
├── name (string)  
├── description (text, nullable)  
├── type (enum: choir, band, orchestra, vocal_group, other)  
├── logo_url (string, nullable)  
├── owner_id (FK → users)  
├── created_at  
└── updated_at  
  
group_members  
├── id (uuid, PK)  
├── group_id (FK → groups)  
├── user_id (FK → users)  
├── role (enum: owner, admin, member)  
├── joined_at  
└── unique(group_id, user_id)  
  
songs  
├── id (uuid, PK)  
├── group_id (FK → groups)  
├── title (string)  
├── artist (string, nullable)  
├── author (string, nullable)  
├── lyrics (text)  
├── chords_data (jsonb) ← estructura de acordes con posiciones  
├── key (string, nullable) ← tonalidad (G, Am, C, etc.)  
├── bpm (integer, nullable)  
├── duration_seconds (integer, nullable)  
├── language (string, nullable)  
├── genre (string, nullable)  
├── cover_url (string, nullable)  
├── created_by (FK → users)  
├── created_at  
└── updated_at  
  
song_categories  
├── id (uuid, PK)  
├── group_id (FK → groups)  
├── name (string)  
├── color (string, nullable)  
└── unique(group_id, name)  
  
song_category_pivot  
├── song_id (FK)  
└── category_id (FK)  
  
song_notes (notas personales por músico)  
├── id (uuid, PK)  
├── song_id (FK → songs)  
├── user_id (FK → users)  
├── content (text)  
├── created_at  
└── updated_at  
└── unique(song_id, user_id)  
  
song_files  
├── id (uuid, PK)  
├── song_id (FK → songs)  
├── file_type (enum: pdf, audio, image, other)  
├── url (string)  
├── filename (string)  
├── size_bytes (integer)  
├── uploaded_by (FK → users)  
└── created_at  
  
favorite_songs  
├── user_id (FK)  
├── song_id (FK)  
└── created_at  
└── PK(user_id, song_id)  
  
events  
├── id (uuid, PK)  
├── group_id (FK → groups)  
├── name (string)  
├── description (text, nullable)  
├── starts_at (timestamp)  
├── ends_at (timestamp, nullable)  
├── location_name (string, nullable)  
├── location_address (string, nullable)  
├── latitude (decimal, nullable)  
├── longitude (decimal, nullable)  
├── created_by (FK → users)  
├── created_at  
└── updated_at  
  
setlists  
├── id (uuid, PK)  
├── event_id (FK → events, nullable)  
├── group_id (FK → groups)  
├── name (string)  
├── description (text, nullable)  
├── created_by (FK → users)  
├── created_at  
└── updated_at  
  
setlist_songs  
├── id (uuid, PK)  
├── setlist_id (FK → setlists)  
├── song_id (FK → songs)  
├── position (integer) ← orden en el setlist  
├── custom_key (string, nullable) ← tonalidad específica  
├── notes (text, nullable)  
└── unique(setlist_id, song_id)  
  
refresh_tokens  
├── id (uuid, PK)  
├── user_id (FK → users)  
├── token_hash (string, unique)  
├── user_agent (string, nullable)  
├── ip_address (string, nullable)  
├── expires_at (timestamp)  
├── revoked_at (timestamp, nullable)  
└── created_at  
  
invitations  
├── id (uuid, PK)  
├── group_id (FK → groups)  
├── email (string)  
├── token (string, unique)  
├── role (enum)  
├── invited_by (FK → users)  
├── expires_at (timestamp)  
├── accepted_at (timestamp, nullable)  
└── created_at  
  
notifications  
├── id (uuid, PK)  
├── user_id (FK → users)  
├── type (string)  
├── title (string)  
├── body (text)  
├── data (jsonb, nullable)  
├── read_at (timestamp, nullable)  
└── created_at  
```  
  
---  
  
## 8. CONVENCIONES TÉCNICAS  
  
### 8.1 Nomenclatura  
- **Tablas:** plural snake_case (`users`, `group_members`, `setlist_songs`)  
- **Columnas:** snake_case (`created_at`, `user_id`)  
- **Modelos Prisma:** PascalCase singular (`User`, `GroupMember`)  
- **Endpoints REST:** kebab-case plural (`/api/groups`, `/api/songs`)  
- **Métodos HTTP:**  
  - `GET` → listar/obtener  
  - `POST` → crear  
  - `PATCH` → actualizar parcial  
  - `PUT` → reemplazar  
  - `DELETE` → eliminar  
- **Variables de entorno:** UPPER_SNAKE_CASE (`DATABASE_URL`, `JWT_SECRET`)  
  
### 8.2 Respuestas de API  
Formato estándar:  
  
**Éxito:**  
```json  
{  
  "success": true,  
  "data": { ... },  
  "meta": { "page": 1, "total": 100 }  
}  
```  
  
**Error:**  
```json  
{  
  "success": false,  
  "error": {  
    "code": "VALIDATION_ERROR",  
    "message": "Datos inválidos",  
    "details": [...]  
  }  
}  
```  
  
### 8.3 Versionado de API  
Todas las rutas inician con `/api/v1/...` para permitir futuras versiones sin romper clientes existentes.  
  
### 8.4 Commits de Git  
Usar **Conventional Commits**:  
- `feat:` nueva funcionalidad  
- `fix:` corrección de bug  
- `docs:` cambios en documentación  
- `style:` formato, sin cambio de lógica  
- `refactor:` refactorización  
- `test:` agregar/modificar tests  
- `chore:` tareas de mantenimiento  
  
Ejemplo: `feat(auth): implementar login con Google OAuth`  
  
### 8.5 Organización de carpetas (backend NestJS)  
```  
api/
├── assets/
│   └── logo.png                    ← Logo oficial (usado en correos)
├── src/
│   ├── auth/                       ← Login, registro, recuperación, JWT
│   │   ├── dto/                    ← LoginDto, RegisterDto, etc.
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt-payload.ts
│   │   └── current-user.decorator.ts
│   ├── users/                      ← CRUD de usuarios (admin)
│   │   ├── dto/user.dto.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── roles/                      ← CRUD de roles y permisos
│   │   ├── dto/role.dto.ts
│   │   ├── roles.controller.ts
│   │   ├── roles.service.ts
│   │   └── roles.module.ts
│   ├── mail/                       ← Nodemailer + plantillas
│   │   ├── email-template.ts
│   │   ├── mail.service.ts
│   │   └── mail.module.ts
│   ├── public/                     ← Recursos públicos (logo)
│   │   ├── public.controller.ts
│   │   └── public.module.ts
│   ├── common/                     ← Utilidades compartidas
│   │   ├── decorators/permissions.decorator.ts
│   │   ├── guards/permissions.guard.ts
│   │   ├── design-tokens.ts
│   │   └── common.module.ts
│   ├── prisma/                     ← PrismaService
│   ├── health/                     ← Health check
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── .env
└── package.json
```  
  
### 8.6 Organización de carpetas (frontend Expo)  
```  
mobile/
├── assets/
│   └── logo.png                    ← Logo cuadrado (512x512)
├── src/
│   ├── components/
│   │   ├── PasswordInput.tsx       ← Campo de contraseña con ojito 👁
│   │   └── UserFormModal.tsx       ← Modal reutilizable para crear/editar usuarios
│   ├── constants/
│   │   ├── theme.ts                ← Tokens de color (fuente única)
│   │   └── config.ts               ← API_URL según plataforma
│   ├── context/
│   │   └── AuthContext.tsx         ← Context con `can()` para permisos
│   ├── navigation/
│   │   └── useNavigation.ts        ← Router casero (migrará a Expo Router)
│   ├── screens/
│   │   ├── AuthScreen.tsx          ← Login/Registro
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── ResetPasswordScreen.tsx
│   │   ├── HomeScreen.tsx          ← Home con secciones condicionales
│   │   ├── ProfileScreen.tsx       ← Perfil propio
│   │   ├── UsersAdminScreen.tsx    ← CRUD de usuarios
│   │   └── RolesAdminScreen.tsx    ← CRUD de roles
│   ├── services/
│   │   ├── api.ts                  ← Instancia de axios
│   │   ├── storage.ts              ← SecureStore/localStorage
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   └── roles.service.ts
│   ├── styles/
│   │   └── global.ts               ← Estilos globales reutilizables
│   └── utils/
│       └── dialogs.ts              ← showAlert/confirmAction multiplataforma
├── App.tsx                          ← Punto de entrada
└── package.json
```  
  
---  
  
## 9. SEGURIDAD  
  
### 9.1 Contraseñas  
- Hash con `bcrypt`, costo mínimo 10.  
- Nunca loggear ni devolver en respuestas.  
  
### 9.2 Tokens  
- Access tokens JWT firmados con secreto robusto.  
- Refresh tokens hasheados en BD (nunca en texto plano).  
- Expiración corta para access (15 min) y larga para refresh (7 días).  
  
### 9.3 Validación  
- Todos los inputs validados con `class-validator` en backend.  
- Sanitización para prevenir XSS/inyección.  
- Rate limiting en endpoints sensibles (auth, registro).  
  
### 9.4 Archivos  
- Validación de MIME type y tamaño.  
- Nombres aleatorios (no confiar en nombre original).  
- Almacenamiento fuera del servidor (Cloudinary/S3).  
  
### 9.5 CORS  
- Configurado para aceptar solo orígenes conocidos.  
- En desarrollo: `http://localhost:8081` (web), emuladores.  
- En producción: dominio específico.  
  
---  
  
## 10. ESTRATEGIA DE DESARROLLO  
  
### 10.1 Enfoque incremental  
Trabajar en fases cortas (1-2 semanas) con entregables funcionales:  
- **Fase 1:** Auth + usuarios + grupos básicos  
- **Fase 2:** Canciones + archivos  
- **Fase 3:** Eventos + setlists + mapas  
- **Fase 4:** Modo escenario + PDFs  
- **Fase 5:** Notificaciones + web + tests + deploy  
  
### 10.2 Flujo de trabajo diario  
1. Revisar este documento maestro.  
2. Identificar la siguiente tarea pendiente.  
3. Implementar en rama feature.  
4. Hacer commit siguiendo Conventional Commits.  
5. Actualizar este documento con el estado.  
6. Planear siguiente sesión.  
  
### 10.3 Control de versiones  
- Rama `main`: código estable listo para producción.  
- Rama `develop`: integración de features.  
- Ramas `feature/*`: desarrollo individual.  
- Pull Requests para integrar features a `develop`.  
  
---  
  
## 11. MÉTRICAS DE ÉXITO  
  
Para considerar el proyecto completo y listo para portafolio:  
  
- [ ] Autenticación completa funcionando (email + Google).  
- [ ] CRUD de grupos, canciones, eventos y setlists funcional.  
- [ ] Modo Escenario utilizable en una presentación real.  
- [ ] Mapas y navegación funcionando.  
- [ ] Generación de PDFs de setlists.  
- [ ] App desplegada y accesible públicamente.  
- [ ] Versión web funcionando.  
- [ ] Tests de los módulos críticos pasando.  
- [ ] README profesional en GitHub.  
- [ ] Video demo de 2-3 minutos.  
- [ ] Diagrama de arquitectura en README.  
- [ ] Documentación de API con Swagger accesible.  
  
---  
  
## 12. NOTAS ADICIONALES  
  
- Este documento debe actualizarse al final de cada sesión de trabajo.  
- Cualquier decisión técnica importante debe registrarse aquí con justificación.  
- Las ideas nuevas se agregan a la sección de "Pendiente" antes de implementarse.  
- El documento sirve como contexto para retomar el proyecto en cualquier momento.  
  
---  

## REGISTRO DE PUERTOS (todos mis proyectos)

| Proyecto | Servicio | Puerto host |
|---|---|---|
| Mis Gastos | Web (Nginx) | 8081 |
| Mis Gastos | PostgreSQL | 5433 |
| Mis Gastos | PgAdmin | 5050 |
| Mis Gastos | Mailpit SMTP | 1025 |
| Mis Gastos | Mailpit UI | 8025 |
| Mi SetList | API (NestJS) | 3000 |
| Mi SetList | Web (Expo) | 8082 |
| Mi SetList | PostgreSQL | 5434 |
| Mi SetList | Mailpit SMTP | 1026 |
| Mi SetList | Mailpit UI | 8026 |
| Mi SetList | Prisma Studio | 5555 |

Regla: antes de crear un proyecto nuevo, revisar esta tabla y elegir puertos libres.

## 13. DECISIONES TÉCNICAS CLAVE (implementadas)

### 13.1 Access token corto (15m) + Refresh token largo (7d) rotativo
Los refresh tokens son de **un solo uso**: al usarlos, se invalidan y se emite uno nuevo. Esto permite detectar robo (si un refresh se usa dos veces, revocamos toda la sesión del usuario).

### 13.2 Tokens hasheados en BD (SHA-256)
Solo el cliente conoce el token crudo. Si alguien roba la base de datos, los tokens no sirven. La contraseña usa bcrypt (más lenta, apropiada para passwords); los tokens usan SHA-256 (rápido, apropiado para secretos de alta entropía).

### 13.3 Errores por campo en el ValidationPipe
El backend devuelve `{ fields: { email: "...", password: "..." } }` para que el móvil pinte cada error **bajo su campo correspondiente** en vez de un toast genérico.

### 13.4 Mensajes genéricos en autenticación
Login y "olvidé contraseña" devuelven mensajes que no revelan si el correo existe (evita enumeración de cuentas).

### 13.5 Respuestas consistentes
`/auth/login`, `/auth/register` y `/auth/me` devuelven el **mismo usuario enriquecido** (con roles y permisos) para evitar el bug del "primer login sin permisos hasta recargar".

### 13.6 Helper de diálogos multiplataforma
`mobile/src/utils/dialogs.ts` centraliza `showAlert` y `confirmAction`. En web usa `window.alert/confirm`; en móvil nativo usa `Alert.alert`. Ninguna pantalla sufre más el "alert silencioso en web".

### 13.7 `editable` en vez de `disabled`
`TextInput` de React Native no acepta `disabled` (esa es de HTML). Se usa `editable={false}`. Sutileza que en web no se nota pero en móvil sí falla.

### 13.8 Prisma 7 + driver adapters
Prisma 7 introdujo los **driver adapters** como forma explícita de conectar a la base de datos. Desde 7.10+ son obligatorios en todos los contextos. Usamos el generador clásico `prisma-client-js` por mejor integración con TypeScript.
  
**FIN DEL DOCUMENTO**  
