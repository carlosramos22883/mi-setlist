// Injectable = decorador que le dice a NestJS "esta clase se puede inyectar en otras"
// OnModuleInit / OnModuleDestroy = "hooks" de ciclo de vida (arranque / apagado)
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// El cliente que Prisma generó a partir de schema.prisma
import { PrismaClient } from '@prisma/client';

// extends PrismaClient → hereda TODOS los métodos de consulta:
//   this.user.findMany(), this.user.create(), this.song.update()...
// implements ... → nos comprometemos a implementar los 2 hooks de ciclo de vida
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Al arrancar la app: abre la conexión a PostgreSQL
  async onModuleInit() {
    await this.$connect();
  }

  // Al apagar la app: cierra la conexión limpiamente (sin fugas)
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
