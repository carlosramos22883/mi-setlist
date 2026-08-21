// main.ts = punto de entrada de la app
import 'dotenv/config'; // Prisma 7: garantiza que .env esté cargado antes que nada
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// bootstrap = la función que "enciende" el servidor
async function bootstrap() {
  // Crea la aplicación NestJS a partir del módulo raíz
  const app = await NestFactory.create(AppModule);

  // Prefijo global: TODAS las rutas vivirán bajo /api/v1
  // (versionado desde el día 1: mañana podrás crear /api/v2 sin romper clientes)
  app.setGlobalPrefix('api/v1');

  // ValidationPipe = validación automática de DTOs (el "FormRequest" de Nest)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no declarados en el DTO
      forbidNonWhitelisted: true, // y además da error si llegan campos extra
      transform: true, // convierte el JSON a instancias tipadas
    }),
  );

  // CORS = qué orígenes (otras webs) pueden llamar a esta API desde el navegador.
  // Por ahora solo nuestro frontend Expo Web en el puerto 8082
  app.enableCors({
    origin: ['http://localhost:8082'],
    credentials: true, // permite enviar credenciales entre orígenes
  });

  // Swagger = documentación interactiva y automática de la API
  const config = new DocumentBuilder()
    .setTitle('Mi SetList API')
    .setDescription(
      'API de Mi SetList: autenticación, grupos, canciones, eventos y setlists.',
    )
    .setVersion('1.0')
    .addBearerAuth() // agrega el botoncito para probar rutas con token JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // disponible en /api/docs

  // ?? = "si PORT no existe o es nulo, usa 3000"
  const port = process.env.PORT ?? 3000;
  await app.listen(port); // enciende el servidor y lo deja escuchando
  console.log(`🎵 Mi SetList API corriendo en http://localhost:${port}`);
}
void bootstrap(); // ejecuta la función
