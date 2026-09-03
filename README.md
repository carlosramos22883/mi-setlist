# Mi SetList - Plataforma de Repertorios Musicales

Plataforma multiplataforma (iOS, Android y Web) para músicos, coros y bandas que necesitan organizar, compartir y consultar su repertorio de canciones de manera colaborativa.

## Tecnologías

- **Backend**: NestJS 10.x
- **Lenguaje**: TypeScript 5.x (ambos lados)
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL 16
- **Frontend**: React Native con Expo (Web + iOS + Android)
- **Contenedores**: Docker & Docker Compose
- **Email Testing**: Mailpit

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
- Expo Go (para pruebas en móvil físico, opcional)

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

### 4. Backend - Instalar dependencias y preparar base de datos

```bash
cd api
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 5. Frontend - Instalar dependencias

```bash
cd mobile
npm install
npm run web
```
El servidor web arrancará automáticamente en http://localhost:8082.

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
| **PostgreSQL** | localhost:5434 | User: misetlist / Pass: misetlist |

## Credenciales de Prueba

| Correo | Contraseña | Rol |
|---|---|---|
| admin@misetlist.app | Admin123! | Administrador |
| demo@misetlist.app | Demo123! | Usuario |

> Se generan automáticamente con `npx prisma db seed`.

## Características Principales

### Autenticación y Seguridad
- Registro e inicio de sesión de usuarios
- Verificación de correo electrónico
- Recuperación de contraseña
- Soft delete de usuarios con actividad (grupos/membresías)
- Administración de usuarios y roles desde la app (RBAC)
- JWT con Access + Refresh Tokens y rotación
- Sistema de roles y permisos granular (RBAC)
- Doble validación: permiso global + rol contextual en el grupo

### Grupos Musicales
- Crear y administrar grupos (coros, bandas, orquestas)
- Subir logo del grupo (recorte circular + sharp)
- Invitar miembros por email
- Roles dentro del grupo: Owner, Admin, Member
- Abandono y eliminación de grupos

### Canciones y Repertorio
- CRUD completo de canciones por grupo
- Letra con acordes en formato ChordPro ([D]texto)
- Tablaturas con fuente monoespaciada
- Tonalidad, BPM, duración, idioma y género
- Categorías múltiples por canción (con color)
- Notas personales por músico (privadas)
- Sistema de favoritos con filtro "solo mis favoritas"
- Búsqueda por título, artista y género

### Setlists (Repertorios)
- Crear setlists por grupo
- Agregar canciones del repertorio
- Reordenamiento con botones ▲▼ (drag & drop en build nativo)
- Tonalidad específica por canción (customKey)
- Notas específicas por canción en el setlist
- Duración total estimada

### Eventos
- Crear eventos con fecha, hora, lugar y dirección
- Filtro próximos / pasados / todos
- Asistencia: Asistiré / Tal vez / No iré (acción personal)
- Setlists asociados al evento
- Enlace "Cómo llegar" a Google Maps

### Modo Escenario
- Pantalla inmersiva con tema oscuro forzado
- Transposición de acordes en vivo (±6 semitonos)
- Tamaño de texto ajustable (3 niveles)
- Auto-scroll con velocidad variable (1-5) y pausa
- Ocultar/mostrar acordes y tablaturas
- Navegación anterior/siguiente en modo setlist
- Pantalla completa en web

### PDFs
- PDF de canción tipo cancionero (acordes alineados sobre la letra)
- PDF de setlist numerado con tonalidad y artista
- Generación en backend con pdfkit

### Multiplataforma
- Web (Expo Web)
- iOS y Android (React Native + Expo)
- Tema oscuro/claro con persistencia
- Diseño responsive y consistente entre plataformas

## Estructura del Proyecto

```text
mi-setlist/
├── api/                  # Backend NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── groups/
│   │   ├── uploads/
│   │   ├── mail/
│   │   ├── public/
│   │   ├── common/
│   │   ├── prisma/
│   │   ├── songs/        # incluye categories
│   │   ├── setlists/
│   │   ├── events/
│   │   └── pdf/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── package.json
├── mobile/               # Frontend React Native
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
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