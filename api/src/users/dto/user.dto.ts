// ============================================================
// DTOs del módulo de usuarios
// ============================================================
// Define la forma de los datos aceptados en cada endpoint.
// Reutilizamos PASSWORD_RULES del DTO de registro para que
// la política sea consistente en toda la app.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Max,
  Min,
} from 'class-validator';
import {
  PASSWORD_RULES,
  PASSWORD_RULE_MESSAGE,
} from '../../auth/dto/register.dto';

// ---------------------------------------------------------
// POST /users  (el admin crea usuarios; rol por defecto: Usuario)
// ---------------------------------------------------------
export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiProperty({ example: 'juan@test.com' })
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsStrongPassword(PASSWORD_RULES, { message: PASSWORD_RULE_MESSAGE })
  password!: string;

  @ApiPropertyOptional({
    description: 'IDs de roles; si va vacío, recibe el rol "Usuario"',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

// ---------------------------------------------------------
// PATCH /users/:id  (el admin edita, puede cambiar roles)
// ---------------------------------------------------------
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsStrongPassword(PASSWORD_RULES, { message: PASSWORD_RULE_MESSAGE })
  password?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

// ---------------------------------------------------------
// PATCH /users/me  (perfil propio; NO permite cambiar roles)
// ---------------------------------------------------------
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsStrongPassword(PASSWORD_RULES, { message: PASSWORD_RULE_MESSAGE })
  password?: string;
}

// ---------------------------------------------------------
// GET /users  (paginación y búsqueda)
// ---------------------------------------------------------
export class QueryUsersDto {
  @ApiPropertyOptional({ example: 'carlos' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number) // convierte string de query a número
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
