import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  // Opcional: si lo envías, revocamos ESE token;
  // si no, revocamos TODAS las sesiones del usuario
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
