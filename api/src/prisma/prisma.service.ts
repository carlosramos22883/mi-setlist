import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Generador clásico: el cliente vive en @prisma/client
import { PrismaClient } from '@prisma/client';
// Prisma 7 conecta con un driver adapter sobre pg
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Adapter con la cadena de conexión del .env
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
