// ============================================================
// USERS MODULE
// ============================================================
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module'; // ← NECESARIO para JwtAuthGuard

@Module({
  imports: [
    MailModule, // para enviar correos de re-verificación
    AuthModule, // ← proporciona JwtAuthGuard y JwtService
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
