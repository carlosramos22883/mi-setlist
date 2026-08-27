// ============================================================
// DTOs del módulo de grupos
// ============================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// ---------------------------------------------------------
// POST /groups — crear un grupo nuevo
// ---------------------------------------------------------
export class CreateGroupDto {
  @ApiProperty({ example: 'Los Rockeros' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiPropertyOptional({ example: 'Banda de rock clásico' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiProperty({ enum: ['band', 'choir', 'orchestra', 'vocal_group', 'other'] })
  @IsEnum(['band', 'choir', 'orchestra', 'vocal_group', 'other'], {
    message: 'Tipo de grupo inválido',
  })
  type!: 'band' | 'choir' | 'orchestra' | 'vocal_group' | 'other';

  @ApiPropertyOptional({
    description: 'Ruta relativa del logo (de POST /uploads/image)',
    example: 'uploads/abc-123.png',
  })
  @IsOptional()
  @IsString()
  logoPath?: string;
}

// ---------------------------------------------------------
// PATCH /groups/:id — editar un grupo
// ---------------------------------------------------------
export class UpdateGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    enum: ['band', 'choir', 'orchestra', 'vocal_group', 'other'],
  })
  @IsOptional()
  @IsEnum(['band', 'choir', 'orchestra', 'vocal_group', 'other'])
  type?: 'band' | 'choir' | 'orchestra' | 'vocal_group' | 'other';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoPath?: string;
}

// ---------------------------------------------------------
// GET /groups — paginación
// ---------------------------------------------------------
export class QueryGroupsDto {
  @ApiPropertyOptional({ example: 'rock' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ---------------------------------------------------------
// POST /groups/:id/members — invitar a un usuario
// ---------------------------------------------------------
export class InviteMemberDto {
  @ApiProperty({ example: 'juan@test.com' })
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email!: string;

  @ApiProperty({ enum: ['admin', 'member'], default: 'member' })
  @IsEnum(['admin', 'member'], { message: 'Rol inválido' })
  role!: 'admin' | 'member';
}

// ---------------------------------------------------------
// PATCH /groups/:id/members/:userId — cambiar rol de miembro
// ---------------------------------------------------------
export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['admin', 'member'] })
  @IsEnum(['admin', 'member'], { message: 'Rol inválido' })
  role!: 'admin' | 'member';
}
