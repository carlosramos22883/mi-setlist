// ============================================================
// DTOs del módulo de roles
// ============================================================
// Define la forma de los datos aceptados en cada endpoint.
// Igual que user.dto.ts: todos los DTOs de roles en un solo archivo.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ---------------------------------------------------------
// POST /roles  (crear un rol nuevo)
// ---------------------------------------------------------
export class CreateRoleDto {
  @ApiProperty({ example: 'Moderador' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiPropertyOptional({ example: 'Puede moderar comentarios' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'IDs de permisos a asignar (obligatorio: al menos uno)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

// ---------------------------------------------------------
// PATCH /roles/:id  (editar un rol existente)
// ---------------------------------------------------------
export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Administrador' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @ApiPropertyOptional({ example: 'Acceso total al sistema' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'IDs de permisos a asignar (reemplaza los existentes)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}
