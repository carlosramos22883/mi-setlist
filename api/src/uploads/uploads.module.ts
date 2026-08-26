// ============================================================
// UPLOADS MODULE
// ============================================================
import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { AuthModule } from '../auth/auth.module'; // ← NECESARIO para JwtAuthGuard

@Module({
  imports: [AuthModule], // ← proporciona JwtAuthGuard y JwtService
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
