# Mi SetList - Plataforma de Repertorios Musicales

Plataforma multiplataforma (iOS, Android y Web) para músicos, coros y bandas que necesitan organizar, compartir y consultar su repertorio de canciones de manera colaborativa.

## Tecnologías

### Backend
- **Runtime:** Node.js (LTS)
- **Lenguaje:** TypeScript
- **Framework:** NestJS
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL 16
- **Autenticación:** JWT + Refresh Tokens + Google OAuth

### Frontend
- **Framework:** React Native con Expo
- **Lenguaje:** TypeScript
- **Navegación:** Expo Router
- **Plataformas:** iOS, Android y Web

### Infraestructura
- **Contenedores:** Docker & Docker Compose
- **Base de Datos:** PostgreSQL 16
- **Email Testing:** Mailpit
- **CI/CD:** GitHub Actions (próximamente)

![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (LTS)
- Git
- Expo Go (para pruebas en móvil físico)

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd mi-setlist
```

### 2. Levantar los contenedores de infraestructura

```bash
docker compose up -d
```

### 3. Verificar que los servicios estén corriendo

```bash
docker compose ps
```

### 4. Backend - Instalar dependencias

```bash
cd api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### 5. Frontend - Instalar dependencias

```bash
cd mobile
npm install
npx expo start --port 8082
```

### 6. Correos en ambiente de pruebas

Se utiliza Mailpit como servidor de correo para desarrollo. Captura todos los emails enviados por la aplicación y los muestra en una interfaz web para testing. Perfecto para probar:

- Verificación de emails
- Recuperación de contraseñas
- Notificaciones del sistema

## Accesos

Una vez que los contenedores estén corriendo, puedes acceder a:

| Servicio | URL | Credenciales |
|---|---|---|
| **API Backend** | http://localhost:3000 | - |
| **Swagger (API Docs)** | http://localhost:3000/api/docs | - |
| **Frontend Web (Expo)** | http://localhost:8082 | - |
| **Mailpit (emails)** | http://localhost:8026 | - |
| **PostgreSQL** | localhost:5434 | User: misetlist / Pass: misetlist_secret |

## Credenciales de Prueba

| Usuario | Rol | Password |
|---|---|---|
| demo@misetlist.app | User | Demo123! |

> Las credenciales de administrador y usuarios de prueba se generan automáticamente con el seeder de Prisma.

## Características Principales

### Autenticación y Seguridad
- Registro e inicio de sesión de usuarios
- Verificación de correo electrónico
- Recuperación de contraseña
- Autenticación social con Google
- JWT con Access + Refresh Tokens
- Rotación de tokens y revocación remota
- Sistema de roles y permisos granular (RBAC)

### Grupos Musicales
- Crear y administrar grupos (coros, bandas, orquestas)
- Invitar miembros por email o enlace
- Roles dentro del grupo: Owner, Admin, Member
- Actividad y feed del grupo

### Canciones y Repertorio
- CRUD completo de canciones
- Letra con acordes estructurados
- Notas personales por músico
- Categorías múltiples por canción
- Archivos adjuntos (PDFs, audios, imágenes)
- Sistema de favoritos
- Búsqueda avanzada y filtros

### Eventos y Setlists
- Crear eventos con ubicación geográfica (mapas)
- Setlists personalizables con drag & drop
- Tonalidad configurable por canción
- Modo Escenario para presentaciones en vivo
- Generación de PDFs de repertorios

### Multiplataforma
- App iOS y Android (React Native + Expo)
- Versión Web (Expo Web)
- Diseño responsive y modo oscuro/claro

## Estructura del Proyecto

```text
mi-setlist/
├── api/                  # Backend NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── groups/
│   │   ├── songs/
│   │   ├── events/
│   │   ├── setlists/
│   │   └── prisma/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── package.json
├── mobile/               # Frontend React Native
│   ├── app/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── constants/
│   └── package.json
├── docs/                 # Documentación del proyecto
├── assets/               # Logo, branding
└── docker-compose.yml
```

## Autor

**Carlos Adolfo Ramos Ramírez**

- LinkedIn: https://www.linkedin.com/in/carlos-adolfo-ramos/
- Email: carlosramos22883@gmail.com
- Portafolio: (próximamente)

## Licencia

Este proyecto es propiedad intelectual de Carlos Adolfo Ramos Ramírez.

Se muestra públicamente únicamente con fines de portafolio profesional.
Queda estrictamente prohibida su copia, distribución o uso sin permiso explícito del autor.

Todos los derechos reservados.