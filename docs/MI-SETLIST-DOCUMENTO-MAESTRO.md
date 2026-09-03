# MI SETLIST - DOCUMENTO MAESTRO  
  
**Última actualización:** Septiembre 2026 (Bloques A–J completados)
**Estado:** Fase 2 completa - Repertorio, eventos, modo escenario y PDFs operativos
  
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
- **Upload de archivos:** almacenamiento local (`api/storage/uploads/`) + normalización con sharp (512×512). S3/Cloudinary pendiente para producción.
- **Generación de PDF:** PDFKit / Puppeteer  
  
#### Frontend Móvil y Web
- **Framework:** React Native con Expo
- **Lenguaje:** TypeScript
- **Navegación:** router casero `useNavigation` (params + transiciones); Expo Router pendiente
- **Tema:** ThemeContext claro/oscuro con persistencia (localStorage en web)
- **Iconos:** @expo/vector-icons (Ionicons)
- **Imágenes:** expo-image-picker (recorte nativo) + react-easy-crop (recorte interactivo en web)
- **Estado global:** React Context + hooks (Zustand/TanStack Query pendientes)
- **Mapas:** react-native-maps (pendiente)
- **Almacenamiento seguro:** expo-secure-store
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
      │  PostgreSQL    │        │ Storage local    │
      │  (datos)       │        │ (uploads + sharp)│
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

**Grupos (implementado en Bloque C con permisos CONTEXTUALES, no RBAC global):**
- Los permisos dentro de un grupo NO usan la tabla `permissions`.
- Se validan por el rol de membresía (`GroupMember.role`): `owner` / `admin` / `member`.
- Cualquier usuario autenticado puede crear grupos (se vuelve Owner).

**Recursos de dominio (Bloque D2 — implementados, permisos GLOBALES):**
- `groups.view` (ver "Mis grupos"), `groups.create`, `groups.edit`, `groups.delete`
- `members.invite`, `members.remove`, `members.change_role`
- `songs.view`, `songs.create`, `songs.edit`, `songs.delete`
- `setlists.view`, `setlists.create`, `setlists.edit`, `setlists.delete`
- `events.view`, `events.create`, `events.edit`, `events.delete`

**Regla de doble validación (Bloque D2):**
Todo endpoint de dominio valida DOS capas:
1. **Permiso global** (`@Permissions('songs.create')`): ¿el rol del usuario lo tiene?
2. **Permiso contextual** (rol de membresía `owner/admin/member`): ¿qué puede hacer en ESTE grupo?

Ejemplo: un usuario con `songs.create` global pero rol `member` en un grupo puede crear canciones; si el admin le quita `songs.create`, ya no puede en ningún grupo.
  
### 3.4 Implementación técnica  
- **Backend:** Guards personalizados de NestJS (`@Permissions('songs.create')`). Implementados: `JwtAuthGuard` + `PermissionsGuard` + decorator `@Permissions`.
- **Frontend:** Context de Auth expone `can('permiso.nombre')` (equivalente móvil de `@can` en Laravel). Implementado en Bloque B2.
- **Verificación obligatoria:** el backend valida pertenencia al grupo y rol de membresía en cada request (helper `checkPermission` en `GroupsService`). ✅ Implementado en Bloque C.

- **Doble capa (Bloque D2):** los endpoints de dominio usan `@Permissions(...)` (RBAC global) + `checkPermission([...])` (rol de membresía). El móvil respeta ambos: `can('songs.create')` muestra/oculta el botón, y el backend revalida el rol contextual.
  
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
- [x] Perfil de usuario (editar nombre, correo, contraseña, avatar)
- [x] Avatar de usuario (recorte circular; topbar, drawer y listados)
- [x] Tema claro/oscuro con persistencia
- [ ] Configuración (notificaciones, idioma)

**Reglas implementadas:**
- Cambio de correo → revoca todas las sesiones + nuevo correo de verificación
- Login, register y /auth/me devuelven el mismo usuario enriquecido (con roles y permisos)
- Errores de validación en español, mostrados bajo cada campo en la UI  
  
### 4.2 Grupos Musicales
- [x] Crear grupo (coro, banda, orquesta, grupo vocal, otro)
- [x] Editar información del grupo (endpoint + GroupFormModal con logo)
- [x] Subir imagen/logo del grupo (picker nativo + crop web interactivo + sharp)
- [x] Búsqueda de grupos (backend + toolbar)
- [x] Acciones rápidas en topbar del detalle (invitar/eliminar vía HeaderActionsContext)
- [x] Invitar miembros por email (endpoint + token; correo de invitación pendiente)
- [ ] Aceptar/rechazar invitaciones (endpoints y UI pendientes)
- [x] Gestión de miembros (cambiar roles, expulsar)
- [x] Abandonar grupo
- [x] Eliminar grupo (solo Owner, soft delete)
- [x] Listar mis grupos
- [ ] Feed de actividad del grupo
- [ ] Transferir propiedad (pendiente)

**Reglas implementadas:**
- Permisos contextuales por membresía (Owner > Admin > Member).
- El Owner no puede ser expulsado ni cambiarle el rol; no puede abandonar.
- Un usuario que posee grupos no puede eliminarse físicamente (soft delete).
  
### 4.3 Canciones
- [x] Crear canción
- [x] Campos: título, artista, autor, letra, tonalidad, BPM, duración, idioma, género
- [x] Categorías múltiples por canción (pivote `song_category_items`)
- [ ] Estructura de acordes (`chordsData` reservado en schema, UI pendiente)
- [ ] Notas generales de la canción (diferentes de notas personales)
- [x] Notas personales por músico (`song_notes`, privadas por usuario)
- [ ] Subir imagen de portada (`coverPath` reservado, UI pendiente)
- [ ] Subir archivos (PDF, MP3)
- [x] Marcar como favorita (`favorite_songs`)
- [x] Búsqueda (título, artista, género)
- [x] Filtro "solo mis favoritas"
- [x] Scope por grupo (las canciones viven dentro de un grupo)

### 4.4 Categorías de canciones
- [x] Crear categorías por grupo (owner/admin)
- [x] Asignar múltiples categorías a una canción
- [x] Quitar categorías de canciones
- [x] Chips de categoría con color en el detalle
- [x] Modal para agregar/crear categorías inline
  
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
- [x] Crear setlist para un grupo
- [x] Agregar canciones del repertorio del grupo
- [x] Reordenar canciones (botones ▲▼; drag & drop pendiente)
- [x] Configurar tonalidad específica por canción (`customKey`)
- [x] Agregar notas específicas al setlist (`notes`)
- [x] Duración estimada total (suma de `durationSeconds`)
- [ ] Duplicar setlist existente
- [ ] Compartir setlist (enlace público temporal)
  
### 4.6 Eventos
- [x] Crear evento (título, descripción, lugar, dirección, coordenadas, fecha/hora)
- [x] Listado con filtro próximos/pasados/todos + búsqueda
- [x] Asistencia: confirmed / declined / maybe (acción personal por membresía)
- [x] Lista de asistentes con contadores por estado
- [x] Setlists asociados al evento (agregar/quitar)
- [x] “🗺️ Cómo llegar” (Google Maps en web)
- [ ] Mapa embebido en móvil nativo (react-native-maps)
- [ ] Recordatorios/notificaciones de eventos
  
### 4.7 Modo Escenario
- [x] Pantalla inmersiva (sin shell de la app)
- [x] Tema oscuro forzado (independiente del tema activo)
- [x] Transposición de acordes en vivo (±6 semitonos, conserva estilo #/b)
- [x] Tamaño de texto ajustable (3 niveles)
- [x] Auto-scroll con velocidad ajustable (1–5) y pausa
- [x] Ocultar/mostrar acordes y tabs
- [x] Pantalla completa en web (Fullscreen API)
- [x] Navegación anterior/siguiente en modo setlist (resetea tono y scroll)
- [x] Aviso de tonalidad específica del setlist (customKey)
  
### 4.8 PDFs
- [x] PDF de canción: cancionero con acordes alineados (Courier + pdfkit)
- [x] PDF de setlist: repertorio numerado con tono y artista
- [x] Generación en backend (funciona para web y futuro nativo)
- [x] Apertura en pestaña nueva (blob) en web
- [ ] Descarga/compartir en nativo (expo-file-system + expo-sharing)
- [ ] Mejoras pendientes del cancionero (backlog de cariño: saltos de página finos, portada)
  
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
- [x] Adaptación responsive con Expo Web (shell con drawer/topbar/footer)
- [x] Mismas funcionalidades que móvil (paridad actual)
- [ ] PWA (instalable en navegador)
  
---  
  
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

**Bloque C — Grupos musicales:**
- [x] Backend: modelos `Group` (logoPath local), `GroupMember`, `GroupInvitation` + enums
- [x] Backend: módulo de uploads (POST /uploads/image con sharp, GET /uploads/:filename)
- [x] Backend: CRUD de grupos con soft delete
- [x] Backend: membresías (invitar, cambiar rol, expulsar, abandonar)
- [x] Backend: permisos contextuales por rol de membresía
- [x] Backend: soft delete de usuarios detecta actividad real (grupos/membresías/invitaciones)
- [x] Seeder: grupos de ejemplo (Rock Band Demo, Coro Municipal)
- [x] Móvil: pantalla "Mis grupos" (lista, paginación, FAB)
- [x] Móvil: crear grupo con logo (picker nativo + upload)
- [x] Móvil: detalle de grupo con miembros y acciones contextuales
- [x] Móvil: modal de invitación por correo
- [x] Navegación con parámetros (useNavigation + params)

**Bloque D — Estandarización de UI:**
- [x] 6 componentes estándar: ScreenHeader, ListToolbar, FormModal, PaginationBar, EmptyState, RowActions
- [x] Refactor de Usuarios, Roles y Grupos para consumirlos (toolbars, modales, paginación y vacíos consistentes)
- [x] Roles: panel inline → FormModal
- [x] Grupos: FAB → toolbar “+ Nuevo grupo”; crear/editar en GroupFormModal con logo
- [x] Detalle de grupo: ScreenHeader + RowActions; acciones rápidas en topbar
- [x] Búsqueda de grupos en backend (Prisma.GroupWhereInput) y móvil

**Bloque D2 — Permisisos globales + doble validación + alerts profesionales:**
- [x] Seeder: 19 permisos de dominio (groups/members/songs/setlists/events) + específicos
- [x] Rol Usuario: todo el dominio, sin administración (users/roles)
- [x] `groups.controller` con `@Permissions` (capa global) + `checkPermission` (contextual)
- [x] Móvil: doble capa `can('...') && rol contextual` en GroupsScreen y GroupDetailScreen
- [x] UI oculta botones según permisos globales (crear/editar/eliminar/invitar)
- [x] SweetAlert2 en web (tematizado claro/oscuro, z-index sobre modales RN) + Alert nativo
- [x] Helpers `showError`/`showSuccess` en dialogs.ts

**Bloque E — Shell global y tema:**
- [x] ThemeContext claro/oscuro con persistencia; Palette ampliado a string (as const + mapped type)
- [x] global.ts → buildGlobalStyles(c); todas las pantallas migradas (useTheme + buildStyles)
- [x] AppShell: topbar (menú, logo, ThemeToggle, chip de usuario con avatar y dropdown), drawer con iconos, sección activa y submenú de administración, footer fijo con lema
- [x] ThemeToggle como componente estándar único (flotante en auth, inline en topbar)
- [x] HeaderActionsContext: acciones contextuales por pantalla en la topbar
- [x] ScreenTransition: animación de entrada (useNativeDriver desactivado en web)

**Bloque F — Avatar de usuario:**
- [x] `avatarPath` en User (migración) + DTOs + USER_SELECT + usuario enriquecido de auth
- [x] uploads.service.ts móvil (uploadImage); interceptor de api.ts respeta FormData (no fuerza JSON)
- [x] ImageCropModal.web.tsx (react-easy-crop, prop round) + dummy nativo (convención .web.tsx/.tsx)
- [x] imageValidation.ts (formato y 5 MB) aplicado a avatares y logos
- [x] UserFormModal y ProfileScreen con avatar circular + botón de cámara
- [x] AppShell y listado de usuarios con avatar real (fallback a iniciales)
- [x] refreshUser en AuthContext; el CRUD sincroniza el user global al editarse a sí mismo
- [x] sharp: `.rotate()` (EXIF) y require tipado con cast local (SharpFactory)

**Bloque G — Canciones y Setlists:**
- [x] Schema: `Song` (tonalidad/BPM/duración/idioma/género/letra/coverPath), `Setlist`, `SetlistSong` (position + customKey + notes)
- [x] Backend: CRUD de canciones con doble validación (`songs.*` global + owner/admin o member)
- [x] Backend: CRUD de setlists + agregar/quitar/reordenar canciones + tonalidad/notas por setlist
- [x] Móvil: `SongsScreen` (ListToolbar, búsqueda, paginación, RowActions con doble capa)
- [x] Móvil: `SongFormModal` (todos los campos, validación inline)
- [x] Móvil: `SongDetailScreen` (letra monoespaciada, chips de metadatos, edición inline con modal)
- [x] Móvil: `SetlistsScreen` + `SetlistFormModal`
- [x] Móvil: `SetlistDetailScreen` (reordenar ▲▼, agregar desde repertorio, customKey/notes, duración estimada)
- [x] Navegación: grupo → canciones/setlists → detalles, con params tipados (cast único de `myRole` en App.tsx)

**Bloque G6 — Extensión de canciones (categorías, notas y favoritas):**
- [x] Schema: `SongCategory`, `SongCategoryItem` (pivote), `SongNote`, `FavoriteSong`
- [x] Backend: CRUD de categorías con doble validación (`categories.*` global + owner/admin)
- [x] Backend: notas personales por usuario (acciones por membresía, sin permisos globales)
- [x] Backend: favoritas por usuario (acciones por membresía)
- [x] Backend: canciones enriquecidas con `isFavorite`, `favoriteCount`, `categories`
- [x] Backend: filtro `favoritesOnly` en listado de canciones
- [x] Móvil: `ChordLyrics` (formato ChordPro con acordes encima + tabs monoespaciados + toggle)
- [x] Móvil: `SongDetailScreen` con corazón de favorita, nota personal, categorías (con color)
- [x] Móvil: modal de agregar/crear categorías inline
- [x] Móvil: filtro "❤️ Solo mis favoritas" en `SongsScreen`
- [x] Móvil: info completa dinámica (solo campos llenos: artista/autor/idioma/género/tonalidad/BPM/duración/autoría/fechas)
- [x] Móvil: botones balanceados con `flex: 1` + `minWidth` en todas las pantallas
- [x] Tipado: `Prisma.SongWhereInput` en lugar de `any` (lección aprendida de TypeScript)

**Bloque H — Eventos:**
- [x] Schema: `Event` (lat/lng/startsAt/endsAt), `EventAttendee` (status + unique), `EventSetlist`
- [x] Backend: CRUD de eventos con doble validación + filtro upcoming + `myStatus` en listado
- [x] Backend: asistencia (upsert/delete personal) + asociación de setlists (owner/admin)
- [x] Móvil: `EventsScreen` (badge de fecha, chips de estado, filtro próximos/pasados)
- [x] Móvil: `EventFormModal` (fecha DD/MM/AAAA + hora HH:mm con parseo y validación inline)
- [x] Móvil: `EventDetailScreen` (asistencia con un tap, asistentes, setlists, “Cómo llegar”)

**Bloque I — Modo Escenario:**
- [x] `transpose.ts` (raíz + bajo, enarmonía conservando #/b)
- [x] `ChordLyrics` con `transpose`, `sizeLevel` y `forceDark`
- [x] `StageScreen` inmersiva: auto-scroll, tamaños, fullscreen, setlist en vivo
- [x] Acceso desde `SongDetail` y `SetlistDetail` (fila 🎸 + 📄)

**Bloque J — PDFs:**
- [x] `PdfService` (pdfkit): canción con acordes alineados + setlist numerado
- [x] Endpoints `GET /pdf/songs/:id` y `GET /pdf/setlists/:id` con doble validación
- [x] Botones “📄 PDF” en móvil (blob → pestaña nueva en web; nativo diferido)

### 🔄 En Progreso
- Ninguno actualmente

### ⏳ Pendiente

**Pendiente de bloques anteriores:**
- [ ] Aceptar/rechazar invitaciones a grupos (endpoints + UI + correo)
- [ ] Feed de actividad del grupo
- [ ] Transferir propiedad de grupo
- [ ] Login con Google OAuth

**Bloque D2 — Permisos globales para todo (próximo):**
- [ ] Agregar permisos globales: groups.*, members.*, songs.*, setlists.*, events.*
- [ ] Seeder: asignar permisos nuevos al rol Administrador (y decidir cuáles para Usuario)
- [ ] Endpoints de grupos: validar `@Permissions` global + rol contextual
- [ ] Móvil: respetar `can('groups.create')`, `can('members.invite')`, etc. en la UI
- [ ] Alerts bonitos: SweetAlert2 en web + Alert nativo en móvil (reemplaza window.alert)

**Paso 6 — Setlists y canciones (Bloque G):**
- [ ] Modelo `Song` con letra, acordes, tonalidad, BPM, archivos
- [ ] Modelo `Setlist` con orden de canciones
- [ ] Modelo `SongCategory` y pivot
- [ ] Modelo `SongNote` (notas personales por músico)
- [ ] Modelo `FavoriteSong`
- [ ] Endpoints CRUD de canciones y setlists
- [ ] Pantallas móviles correspondientes

**Bloque G6 — Extensión de canciones (pendiente):**
- [ ] Categorías por grupo + pivote canción↔categoría
- [ ] Notas personales por músico (`song_notes`)
- [ ] Favoritas (`favorite_songs`)
- [ ] UI de portada y archivos de canción

**Paso 7 — Reproductor de audio (Bloque H):**
- [ ] `expo-av` para reproducción
- [ ] Subida de archivos (S3 / almacenamiento local)
- [ ] Controles de reproducción integrados

**Paso 8 — Modo offline (Bloque I):**
- [ ] Cache con AsyncStorage
- [ ] Cola de sincronización al recuperar conexión

**Paso 9 — Calidad y despliegue (Bloque J):**
- [ ] Tests backend (Vitest) y móvil (Jest)
- [ ] Dockerfile multi-stage para la API
- [ ] Deploy web en Vercel
- [ ] Builds iOS/Android con EAS
- [ ] CI/CD con GitHub Actions
  
---  
  
## 6. PRÓXIMOS PASOS INMEDIATOS

1. **Bloque K (deploy):** API a Render/Railway + web a Vercel/Netlify + BD gestionada (Neon/Supabase) + variables de entorno.
2. **Bloque L:** mejoras del cancionero PDF + descarga/compartir en nativo.
3. **Bloque M:** build nativo (EAS) → react-native-maps embebido, compartir PDF, drag & drop reactivado.
4. **Bloque N:** Expo Router (navegación por archivos) + modo offline.
5. **Bloque O:** tests (Jest backend) y biblioteca pública de canciones.
  
---  
  
## 7. ESTRUCTURA DE BASE DE DATOS (borrador inicial)  
  
### Tablas principales  
  
```  
### Tablas implementadas (Bloques A, B y F)

users (IMPLEMENTADA - Bloques A/F)
├── id (uuid, PK)
├── name (string)
├── email (string, unique)
├── password_hash (string, nullable)
├── email_verified_at (timestamp, nullable)
├── avatar_path (string, nullable)  ← ruta relativa en storage
├── created_at
├── updated_at
└── deleted_at (timestamp, nullable)  ← soft delete

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
  
groups (IMPLEMENTADA - Bloque C)
├── id (uuid, PK)
├── name (string)
├── description (text, nullable)
├── type (enum: band, choir, orchestra, vocal_group, other)
├── logo_path (string, nullable)  ← ruta relativa en storage, NO URL externa
├── owner_id (FK → users, ON DELETE RESTRICT)
├── created_at
├── updated_at
└── deleted_at (timestamp, nullable)  ← soft delete

group_members (IMPLEMENTADA - Bloque C)
├── id (uuid, PK)
├── group_id (FK → groups, ON DELETE CASCADE)
├── user_id (FK → users, ON DELETE CASCADE)
├── role (enum: owner, admin, member)
├── joined_at
└── unique(group_id, user_id)

group_invitations (IMPLEMENTADA - Bloque C)
├── id (uuid, PK)
├── group_id (FK → groups, ON DELETE CASCADE)
├── email (string, index)
├── token (string, unique)
├── role (enum: owner, admin, member)
├── invited_by_id (FK → users, ON DELETE CASCADE)
├── status (enum: pending, accepted, declined, expired)
├── expires_at
├── accepted_at (nullable)
└── created_at
  
songs (IMPLEMENTADA - Bloque G)
├── id (uuid, PK)
├── group_id (FK → groups, ON DELETE CASCADE)
├── title (string)
├── artist (string, nullable)
├── author (string, nullable)
├── lyrics (text, default "")
├── chords_data (jsonb, nullable)  ← reservado
├── key (string, nullable)  ← tonalidad (campo songKey en Prisma)
├── bpm (integer, nullable)
├── duration_seconds (integer, nullable)
├── language (string, nullable)
├── genre (string, nullable)
├── cover_path (string, nullable)  ← reservado
├── created_by (FK → users, ON DELETE RESTRICT)
├── created_at / updated_at
└── deleted_at (nullable)  ← soft delete 
  
song_categories (IMPLEMENTADA - Bloque G6)
├── id (uuid, PK)
├── group_id (FK → groups, ON DELETE CASCADE)
├── name (string)
├── color (string, nullable)  ← hex opcional para chips
├── created_at
└── unique(group_id, name)

song_category_items (IMPLEMENTADA - Bloque G6)
├── song_id (FK → songs, ON DELETE CASCADE)
├── category_id (FK → song_categories, ON DELETE CASCADE)
└── id(song_id, category_id)

song_notes (IMPLEMENTADA - Bloque G6)
├── id (uuid, PK)
├── song_id (FK → songs, ON DELETE CASCADE)
├── user_id (FK → users, ON DELETE CASCADE)
├── content (text)
├── created_at / updated_at
└── unique(song_id, user_id)  ← una nota por músico por canción
  
song_files  
├── id (uuid, PK)  
├── song_id (FK → songs)  
├── file_type (enum: pdf, audio, image, other)  
├── url (string)  
├── filename (string)  
├── size_bytes (integer)  
├── uploaded_by (FK → users)  
└── created_at  
  
favorite_songs (IMPLEMENTADA - Bloque G6)
├── user_id (FK → users, ON DELETE CASCADE)
├── song_id (FK → songs, ON DELETE CASCADE)
├── created_at
└── id(user_id, song_id)
  
events (IMPLEMENTADA - Bloque H)
├── id (uuid, PK)
├── group_id (FK → groups, ON DELETE CASCADE)
├── title / description (nullable)
├── location (nullable) / address (nullable)
├── latitude (float, nullable) / longitude (float, nullable)
├── starts_at (timestamp) / ends_at (nullable)
├── created_by (FK → users, ON DELETE RESTRICT)
├── created_at / updated_at / deleted_at

event_attendees (IMPLEMENTADA - Bloque H)
├── id (uuid, PK)
├── event_id (FK → events, ON DELETE CASCADE)
├── user_id (FK → users, ON DELETE CASCADE)
├── status (pending | confirmed | declined | maybe)
├── created_at / updated_at
└── unique(event_id, user_id)

event_setlists (IMPLEMENTADA - Bloque H)
├── id (uuid, PK)
├── event_id (FK → events, ON DELETE CASCADE)
├── setlist_id (FK → setlists, ON DELETE CASCADE)
└── unique(event_id, setlist_id)
  
setlists (IMPLEMENTADA - Bloque G)
├── id (uuid, PK)
├── group_id (FK → groups, ON DELETE CASCADE)
├── name (string)
├── description (text, nullable)
├── created_by (FK → users, ON DELETE RESTRICT)
├── created_at / updated_at
└── deleted_at (nullable)

setlist_songs (IMPLEMENTADA - Bloque G)
├── id (uuid, PK)
├── setlist_id (FK → setlists, ON DELETE CASCADE)
├── song_id (FK → songs, ON DELETE CASCADE)
├── position (integer)  ← orden en el setlist
├── custom_key (string, nullable)  ← tonalidad específica
├── notes (text, nullable)  ← notas específicas
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
│   ├── uploads/                    ← Subida de archivos local + sharp
│   │   ├── uploads.controller.ts
│   │   ├── uploads.service.ts
│   │   └── uploads.module.ts
│   ├── groups/                     ← CRUD de grupos y membresías
│   │   ├── dto/group.dto.ts
│   │   ├── groups.controller.ts
│   │   ├── groups.service.ts
│   │   └── groups.module.ts
│   ├── pdf/
│   │   ├── pdf.controller.ts
│   │   ├── pdf.module.ts
│   │   └── pdf.service.ts
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
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── AppShell.tsx            ← topbar + drawer + footer
│   │   ├── ThemeToggle.tsx         ← único toggle claro/oscuro
│   │   ├── ScreenTransition.tsx    ← animación de entrada
│   │   ├── ScreenHeader.tsx        ← título + volver (+ acciones)
│   │   ├── ListToolbar.tsx         ← búsqueda + controles + “+ Nuevo”
│   │   ├── FormModal.tsx           ← modal estándar crear/editar
│   │   ├── PaginationBar.tsx
│   │   ├── EmptyState.tsx
│   │   ├── RowActions.tsx          ← ✏️ / 🗑️ de fila
│   │   ├── PasswordInput.tsx
│   │   ├── UserFormModal.tsx       ← con avatar circular
│   │   ├── GroupFormModal.tsx      ← crear/editar grupo con logo
│   │   ├── ImageCropModal.web.tsx  ← cropper interactivo (web)
│   │   └── ImageCropModal.tsx      ← dummy nativo
│   │   ├── SongFormModal.tsx       ← crear/editar canción
│   │   ├── SetlistFormModal.tsx    ← crear/editar setlist
│   │   ├── EventFormModal.tsx
│   ├── constants/
│   │   ├── theme.ts                ← paletas + Palette
│   │   └── config.ts               ← API_URL por plataforma
│   ├── context/
│   │   ├── AuthContext.tsx         ← can() + refreshUser()
│   │   ├── ThemeContext.tsx
│   │   └── HeaderActionsContext.tsx
│   ├── navigation/
│   │   └── useNavigation.ts        ← router casero con params
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── ResetPasswordScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx       ← con avatar circular
│   │   ├── UsersAdminScreen.tsx
│   │   ├── RolesAdminScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   └── GroupDetailScreen.tsx
│   │   ├── SongsScreen.tsx         ← lista de canciones del grupo
│   │   ├── SongDetailScreen.tsx    ← letra + metadatos + edición inline
│   │   ├── SetlistsScreen.tsx      ← lista de setlists
│   │   └── SetlistDetailScreen.tsx ← reordenar ▲▼ + customKey/notes
│   │   ├── ChordLyrics.tsx           ← letra con acordes + tabs (ChordPro)
│   │   ├── EventsScreen.tsx
│   │   └── EventDetailScreen.tsx
│   │   └── StageScreen.tsx
│   ├── services/
│   │   ├── categories.service.ts
│   │   ├── api.ts                  ← interceptores (Bearer, refresh, FormData)
│   │   ├── storage.ts
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── roles.service.ts
│   │   ├── groups.service.ts
│   │   └── uploads.service.ts      ← uploadImage multiplataforma
│   │   ├── songs.service.ts
│   │   └── setlists.service.ts
│   │   └── events.service.ts
│   │   └── pdf.service.ts
│   ├── styles/
│   │   └── global.ts               ← buildGlobalStyles(c)
│   └── utils/
│       ├── dialogs.ts
│       └── imageValidation.ts      ← formato + 5 MB
│   │   └── transpose.ts
├── App.tsx
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
- Almacenamiento local en `api/storage/uploads/` (carpeta en .gitignore), servido por `GET /uploads/:filename`. Nombres aleatorios (uuid). Normalización con sharp (512×512, fit cover). S3/Cloudinary pendiente para producción.
  
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

### 13.9 Archivos en el sistema, no en URLs externas
Los uploads se guardan en disco local (`api/storage/uploads/`) y la BD almacena solo la ruta relativa (`logoPath`). La API los sirve por `GET /uploads/:filename`. Así el proyecto no depende de servicios externos en desarrollo.

### 13.10 Permisos contextuales por grupo (no RBAC global)
Dentro de un grupo, los permisos dependen del rol de membresía (Owner/Admin/Member), no de la tabla global `permissions`. El RBAC global gobierna la administración del sistema; los roles de grupo gobiernan cada grupo. Cualquier usuario puede crear un grupo y volverse Owner.

### 13.11 Soft delete con actividad real
Un usuario solo se elimina físicamente si NO tiene actividad (grupos, membresías, invitaciones). Si tiene actividad, se marca `deletedAt` y se revocan sus sesiones. Igual para grupos (`deletedAt`).

### 13.12 `@Transform` para booleanos en query params
`@Type(() => Boolean)` convierte el string `"false"` en `true` (truthy). Para filtros como `?includeDeleted=` usamos `@Transform(({ value }) => value === 'true')`.

### 13.13 Recorte de imágenes multiplataforma
Croppie (librería DOM) no sirve en React Native nativo. Solución: `expo-image-picker` con `allowsEditing` (recortador nativo del SO) + normalización final con sharp en el servidor. Resultado consistente en iOS/Android/Web.

### 13.14 Tema dinámico con co-locación de estilos
`useTheme()` expone `c` (paleta) y `g` (globales). Cada pantalla define `buildStyles(c)` y construye `styles` dentro del componente. Regla: estilo usado en ≥2 pantallas → global o componente compartido; usado en 1 → local.

### 13.15 Shell global estilo “Mis Gastos”
Topbar + drawer + footer fijo en AppShell. El drawer marca la sección activa y respeta permisos (`can()`). Las acciones contextuales de cada pantalla viajan por HeaderActionsContext (ej.: invitar/eliminar en el detalle de grupo).

### 13.16 Modales vs pantallas completas
Modal = tarea rápida de 1-3 campos (crear/editar usuario, rol, grupo). Pantalla completa = gestión y exploración (detalle de grupo con miembros). Regla de UX adoptada tras revisar el caso del detalle de grupo.

### 13.17 Recorte de imágenes por plataforma
Convención Expo `.web.tsx` / `.tsx`: en web se usa react-easy-crop (zoom + arrastre, viewport cuadrado o circular); en nativo recorta el SO (`allowsEditing`). Validación de formato (jpg/png/gif/webp) y 5 MB en cliente y servidor.

### 13.18 sharp: EXIF y tipado de require
`.rotate()` aplica la orientación EXIF (corrige fotos giradas). El `require('sharp')` se mantiene (runtime CJS) pero tipado con cast local `SharpFactory` para satisfacer ESLint/TS sin perder pragmatismo.

### 13.19 `refreshUser()` tras escrituras propias
Toda escritura que toque al usuario logueado termina con `refreshUser()` (Perfil siempre; CRUD de usuarios cuando `id === currentUser.id`). Así topbar/drawer/perfil nunca quedan desincronizados.

### 13.20 Interceptor de axios respeta FormData
Si `config.data instanceof FormData`, se elimina `Content-Type` para que el navegador/axios ponga `multipart/form-data` con boundary. Forzar JSON rompía los uploads (clásico 400 “debes enviar un archivo en el campo file”).

### 13.21 Doble capa de permisos (global + contextual)
El RBAC global (`permissions`) decide QUÉ acciones puede hacer un rol en el sistema; el rol de membresía (`owner/admin/member`) decide QUÉ puede hacer en cada grupo. Todo endpoint de dominio valida ambos. Esto permite al admin controlar, por ejemplo, que un rol no pueda crear grupos aunque sea owner de uno.

### 13.22 Alerts con SweetAlert2 en web
`window.alert` se ve poco profesional en web. Usamos SweetAlert2 cuando `Platform.OS === 'web'` y `Alert.alert` nativo en iOS/Android. El helper `dialogs.ts` centraliza la decisión por plataforma.

### 13.23 Migración a Expo Router (después del Bloque G)
El router casero `useNavigation` fue útil para iterar rápido, pero Expo Router da deep linking, URLs limpias en web y lazy loading. Se migra cuando haya más pantallas (post-Bloque G) para que el esfuerzo valga la pena.

### 13.24 Canciones reutilizables y biblioteca pública (post-Bloque G)
Una canción pertenece a un grupo pero puede usarse en muchos setlists (muchos a muchos con `setlist_songs`, cada uno con su tonalidad/notas). La "biblioteca pública" (copiar canciones de otros grupos) se agrega después como feature extra, sin complicar el modelo inicial.

### 13.25 SweetAlert2 tematizado y por encima de modales
El backdrop, fondo, texto y botones de cada diálogo leen el tema activo (`ms_theme` en localStorage) vía `themeOptions()`. El z-index se fija al máximo (2147483647) para quedar sobre los `Modal` de RN Web, que usan el mismo valor; gana por orden de inserción en el DOM.

### 13.26 Doble validación implementada en grupos
Todo endpoint de dominio valida permiso global (`@Permissions`) + rol de membresía (`checkPermission`). La UI móvil replica ambas capas con `can() && rol`. Esto permite al admin crear roles restrictivos (ej. “solo ver”) sin tocar código.

### 13.27 Reordenamiento con ▲▼ (no drag & drop)
Los botones subir/bajar funcionan igual en web y nativo, son accesibles y usan `PATCH /setlists/:id/reorder` enviando el array completo de posiciones. El drag & drop (react-native-draggable-flatlist) queda como mejora futura sin romper el endpoint.

### 13.28 Edición inline con modal en pantallas de detalle
`SongDetailScreen` edita abriendo `SongFormModal` en la misma pantalla, en vez de navegar a una pantalla `songEdit` inexistente. Menos navegación rota, más contexto conservado. Regla: si la edición ya tiene modal estándar, el detalle lo reutiliza.

### 13.29 La misma canción, distinta en cada setlist
`SetlistSong` guarda `customKey` y `notes` propios: un coro puede cantar la canción en La menor y la banda en Sol, sin tocar la canción original. El chip de tonalidad muestra `customKey ?? song.songKey`.

### 13.30 Formato ChordPro para letra + acordes
Los acordes se guardan dentro de `lyrics` con corchetes: `[D]texto [A]texto`. El componente `ChordLyrics` parsea y pinta acordes encima de sílabas (flexbox, sin depender de fuente monoespaciada). Las tabs se detectan por patrón `^[eEbBgGdDaA]\s*[|!]` y se pintan en monoespaciada. El toggle "🎸 Ver/Ocultar" oculta acordes y tabs, dejando solo la letra limpia.

### 13.31 Notas personales vs notas de canción
`SongNote` es privada por usuario (cada músico tiene su propia nota). Las "notas de canción" (públicas, visibles por todos los miembros) quedan pendientes. Esto permite que cada músico anote "bajar medio tono en el coro" sin afectar a los demás.

### 13.32 Favoritas como acción personal
Marcar/quitar favoritas no requiere permisos globales nuevos (`songs.*`), solo membresía en el grupo. Esto evita que el admin tenga que configurar permisos para una acción que no afecta al grupo.

### 13.33 Tipado de Prisma: adiós any
En lugar de `const where: any`, usar `const where: Prisma.SongWhereInput` (patrón `Prisma.<Modelo>WhereInput`). El tooltip del método muestra lo que TÚ envías; para ver lo que espera, Ctrl+clic en el método → buscar `<Modelo>FindManyArgs` → ahí vive `where?: Prisma.<Modelo>WhereInput`.

### 13.34 Botones balanceados: regla flex:1
En filas de botones, todos con `flex: 1` + `minWidth` (o `flexBasis` en filas con wrap). Nunca mezclar flex y no-flex en la misma fila. Aplicado en: `SongDetail`, `GroupDetail`, `SetlistDetail`.

### 13.35 Info dinámica: solo campos llenos
El detalle de canción muestra filas condicionales (`InfoRow` que retorna `null` si `value` es vacío). Esto permite que una canción mínima (solo título) tenga una tarjeta limpia, y una canción completa muestre toda la metadata sin campos "—".

### 13.36 Fecha y hora amigables en formularios
El modal de eventos usa inputs “DD/MM/AAAA” y “HH:mm” con parseo manual (`parseDateTime`), porque RN no tiene datepicker nativo en web. Valida inline y convierte a ISO para el backend.

### 13.37 Ubicación: enlace en web, MapView en nativo
En web, “🗺️ Cómo llegar” abre Google Maps (`Linking.openURL`) con coordenadas o dirección. El mapa embebido (react-native-maps) se activa al compilar nativo; las coordenadas ya están guardadas.

### 13.38 Asistencia como acción personal
Responder a un evento (confirmed/declined/maybe) no requiere permisos globales: basta membresía, igual que favoritas y notas personales. Asociar setlists al evento sí es gestión (owner/admin).

### 13.39 myStatus en el detalle calculado del listado de asistentes
El detalle de evento no trae `myStatus`; se calcula en cliente buscando mi userId en `attendees`. Si mañana se necesita en más pantallas, moverlo al backend como en el listado de eventos.

### 13.40 PDF generado en el backend
pdfkit en NestJS: el PDF es un endpoint autenticado (JWT en header), no una URL pública. Web lo consume como blob y lo abre en pestaña nueva; nativo lo descargará con expo-file-system. Un solo generador para todas las plataformas.

### 13.41 Cancionero monoespaciado
El PDF de canción usa Courier para letra y acordes: el ancho de carácter fijo permite alinear acordes encima de sílabas con matemática simple (col × charW). Wrapping de líneas largas reubica los acordes en el fragmento correcto.

### 13.42 forceDark: el que impone el fondo, impone los colores
StageScreen fuerza paleta oscura; ChordLyrics recibe `forceDark` para no leer el tema global. Regla general para superficies inmersivas (video, escenario).

### 13.43 esModuleInterop obligatorio con librerías CJS
`allowSyntheticDefaultImports` solo silencia tipos; `esModuleInterop` agrega el helper de runtime. Sin él, `import X from 'lib-cjs'` compila pero explota (`X.default is not a constructor`). Activado en api/tsconfig.json.

### 13.44 Auto-scroll con intervalo (no animación)
setInterval de 30ms que incrementa el offset del ScrollView: pausable, reanudable desde scroll manual y con velocidad variable. Más predecible que animaciones largas en RN Web.

### 13.45 Features diferidas al build nativo
Drag & drop (react-native-draggable-flatlist), mapa embebido (react-native-maps) y compartir PDF (expo-sharing) quedan activables al compilar nativo con EAS; hoy tienen respaldo funcional en web (▲▼, “Cómo llegar”, blob).
  
**FIN DEL DOCUMENTO**  
