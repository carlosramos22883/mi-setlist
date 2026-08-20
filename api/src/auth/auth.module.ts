import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    // JwtModule vacío: los secretos se pasan en cada sign/verify
    // (porque usamos secretos distintos para access y refresh)
    JwtModule.register({}),
    MailModule, // para enviar correos de verificación
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Exportamos el guard y JwtModule para que OTROS módulos
  // (songs, groups, events...) puedan proteger rutas con solo
  // importar AuthModule
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
