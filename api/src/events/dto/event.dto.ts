// ============================================================
// DTOs del módulo de eventos
// ============================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Max,
  Min,
} from 'class-validator';

// ---------------------------------------------------------
// POST /groups/:groupId/events
// ---------------------------------------------------------
export class CreateEventDto {
  @ApiProperty({ example: 'Concierto de Primavera' })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Teatro Municipal' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Av. Principal 123, Ciudad' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 19.4326 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -99.1332 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: '2026-09-15T19:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

// ---------------------------------------------------------
// PATCH /events/:id
// ---------------------------------------------------------
export class UpdateEventDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

// ---------------------------------------------------------
// GET (paginación + búsqueda + próximos/pasados)
// ---------------------------------------------------------
export class QueryEventsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'true = próximos, false = pasados, omitir = todos',
  })
  @IsOptional()
  @Type(() => Boolean)
  upcoming?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ---------------------------------------------------------
// PUT /events/:id/attend — mi respuesta de asistencia
// ---------------------------------------------------------
export class SetAttendanceDto {
  @IsIn(['confirmed', 'declined', 'maybe'], {
    message: 'Estado inválido (confirmed | declined | maybe)',
  })
  status!: 'confirmed' | 'declined' | 'maybe';
}

// ---------------------------------------------------------
// POST /events/:id/setlists — asociar setlist al evento
// ---------------------------------------------------------
export class AddSetlistToEventDto {
  @IsString()
  @IsNotEmpty()
  setlistId!: string;
}
