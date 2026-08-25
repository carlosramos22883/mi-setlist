// ============================================================
// ROLES MODULE
// ============================================================
import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // para JwtAuthGuard
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
