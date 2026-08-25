// ============================================================
// PRISMA.CONFIG.TS — el "cerebro" del CLI de Prisma 7
// ============================================================
// En Prisma 7, el CLI ya no saca la URL del schema.prisma:
// la lee de ESTE archivo. Por eso cargamos .env aquí.
import 'dotenv/config'; // carga .env → process.env.DATABASE_URL existe
import type { PrismaConfig } from 'prisma';

export default {
  // Dónde viven el schema y las migraciones
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'npx tsx prisma/seed.ts' },

  // URL de conexión para el CLI (migrate, studio, etc.)
  datasource: {
    url: process.env.DATABASE_URL!, // "!" = confiamos en que siempre existe
  },
} satisfies PrismaConfig; // valida que la forma sea la correcta
