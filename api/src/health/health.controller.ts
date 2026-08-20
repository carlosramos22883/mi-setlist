// Un Controller = quien atiende peticiones HTTP
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// @Controller('health') = las rutas de esta clase empiezan con /health
// (con el prefijo global de main.ts, la URL final es /api/v1/health)
@Controller('health')
export class HealthController {
  // INYECCIÓN DE DEPENDENCIAS (igual que en Laravel):
  // al pedir PrismaService en el constructor, NestJS te entrega la instancia.
  // "private readonly" es un atajo de TypeScript que crea la propiedad
  // this.prisma y le asigna el valor automáticamente.
  constructor(private readonly prisma: PrismaService) {}

  // @Get() = este método responde a GET /api/v1/health
  @Get()
  async check() {
    // Consulta mínima para comprobar que la BD responde
    await this.prisma.$queryRaw`SELECT 1`;

    // Lo que retornas aquí se convierte automáticamente en el JSON de respuesta
    return {
      ok: true,
      service: 'mi-setlist-api',
      database: 'connected',
      timestamp: new Date().toISOString(), // Fecha actual en formato ISO
    };
  }
}
