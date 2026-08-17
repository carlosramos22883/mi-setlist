# MI SETLIST - DOCUMENTO MAESTRO  
  
**Última actualización:** Agosto 2026 (Inicio del proyecto)  
**Estado:** Fase 0 - Configuración inicial  
  
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
| Rol | Descripción |  
|-----|-------------|  
| **Super Admin** | Acceso total al sistema. Gestión de usuarios, configuración global. |  
| **User** | Usuario estándar. Puede crear grupos, canciones, eventos. |  
  
### 3.2 Roles dentro de un grupo  
Cada grupo musical tiene sus propios roles internos:  
  
| Rol | Permisos |  
|-----|----------|  
| **Owner** | Todo. Puede eliminar el grupo, transferir propiedad. |  
| **Admin** | Gestionar miembros, eventos, canciones, setlists. |  
| **Member** | Ver contenido, agregar notas personales, marcar favoritas. |  
| **Invited** | Pendiente de aceptar invitación. Solo puede aceptar/rechazar. |  
  
### 3.3 Permisos granulares (por recurso)  
Para cada recurso se definen permisos CRUD:  
  
- `groups.create`, `groups.view`, `groups.edit`, `groups.delete`  
- `songs.create`, `songs.view`, `songs.edit`, `songs.delete`  
- `events.create`, `events.view`, `events.edit`, `events.delete`  
- `setlists.create`, `setlists.view`, `setlists.edit`, `setlists.delete`  
- `members.invite`, `members.remove`, `members.change_role`  
  
### 3.4 Implementación técnica  
- **Backend:** Guards personalizados de NestJS (`@Permissions('songs.create')`).  
- **Frontend:** Hook `usePermission()` para mostrar/ocultar botones.  
- **Verificación obligatoria:** el backend valida pertenencia al grupo en cada request.  
  
---  
  
## 4. MÓDULOS FUNCIONALES  
  
### 4.1 Autenticación y Usuarios  
- [x] Diseño conceptual  
- [ ] Registro de usuario (email + password)  
- [ ] Login con email/password  
- [ ] Login con Google OAuth  
- [ ] Verificación de correo electrónico  
- [ ] Recuperación de contraseña (email con token)  
- [ ] Cambio de contraseña  
- [ ] Refresh tokens y rotación  
- [ ] Logout (revocación de tokens)  
- [ ] Perfil de usuario (editar datos, foto, instrumento)  
- [ ] Configuración (notificaciones, idioma, tema)  
  
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
  
### ✅ Completado  
- [x] Definición del concepto y nombre: **Mi SetList**  
- [x] Definición del stack tecnológico  
- [x] Diseño conceptual de módulos y funcionalidades  
- [x] Logo inicial generado  
- [x] Creación de este documento maestro  
  
### 🔄 En Progreso  
- [ ] Configuración inicial del proyecto  
- [ ] Setup de Docker Compose (PostgreSQL + Mailpit + Redis)  
- [ ] Inicialización del backend con NestJS  
- [ ] Inicialización del frontend con Expo  
  
### ⏳ Pendiente (Fase 1 - MVP, 2 semanas)  
- [ ] Backend: estructura base NestJS  
- [ ] Backend: módulo de autenticación completo  
- [ ] Backend: módulo de usuarios y perfil  
- [ ] Backend: módulo de grupos  
- [ ] Backend: módulo de canciones básico  
- [ ] Frontend: estructura base Expo + TypeScript  
- [ ] Frontend: pantallas de auth (login, registro)  
- [ ] Frontend: navegación principal  
- [ ] Frontend: lista de grupos y canciones  
- [ ] Conexión frontend ↔ backend  
  
### ⏳ Pendiente (Fase 2 - Core features, 2 semanas)  
- [ ] Eventos con mapas  
- [ ] Setlists y reordenamiento  
- [ ] Modo Escenario  
- [ ] Subida de archivos  
- [ ] Generación de PDFs  
  
### ⏳ Pendiente (Fase 3 - Pulido, 2 semanas)  
- [ ] Notificaciones (push + email)  
- [ ] Versión web  
- [ ] Tests automatizados  
- [ ] CI/CD con GitHub Actions  
- [ ] Deploy a producción (backend + frontend)  
- [ ] Video demo para portafolio  
  
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
users  
├── id (uuid, PK)  
├── name (string)  
├── email (string, unique)  
├── password_hash (string, nullable para OAuth)  
├── avatar_url (string, nullable)  
├── instrument (string, nullable)  
├── email_verified_at (timestamp, nullable)  
├── google_id (string, nullable, unique)  
├── created_at  
└── updated_at  
  
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
├── src/  
│   ├── auth/           ← módulo de autenticación  
│   ├── users/          ← módulo de usuarios  
│   ├── groups/         ← módulo de grupos  
│   ├── songs/          ← módulo de canciones  
│   ├── events/         ← módulo de eventos  
│   ├── setlists/       ← módulo de setlists  
│   ├── files/          ← módulo de subida de archivos  
│   ├── notifications/  ← módulo de notificaciones  
│   ├── common/         ← utilidades compartidas  
│   │   ├── decorators/  
│   │   ├── guards/  
│   │   ├── interceptors/  
│   │   └── pipes/  
│   └── prisma/         ← servicio Prisma  
├── prisma/  
│   ├── schema.prisma  
│   ├── migrations/  
│   └── seed.ts  
├── test/  
├── docker-compose.yml  
└── package.json  
```  
  
### 8.6 Organización de carpetas (frontend Expo)  
```  
mobile/  
├── app/                ← rutas (Expo Router)  
│   ├── (auth)/         ← grupo de rutas de auth  
│   ├── (tabs)/         ← tabs principales  
│   └── _layout.tsx  
├── src/  
│   ├── components/     ← componentes reutilizables  
│   ├── hooks/          ← custom hooks  
│   ├── services/       ← llamadas a API  
│   ├── stores/         ← Zustand stores  
│   ├── types/          ← tipos TypeScript  
│   ├── utils/          ← utilidades  
│   └── constants/      ← constantes  
├── assets/             ← imágenes, fuentes  
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
  
**FIN DEL DOCUMENTO**  
