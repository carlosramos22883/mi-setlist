// ============================================================
// DTOs del módulo de canciones
// ============================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// ---------------------------------------------------------
// POST /groups/:groupId/songs
// ---------------------------------------------------------
export class CreateSongDto {
  @ApiProperty({ example: 'Bohemian Rhapsody' })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title!: string;

  @ApiPropertyOptional({ example: 'Queen' })
  @IsOptional()
  @IsString()
  artist?: string;

  @ApiPropertyOptional({ example: 'Freddie Mercury' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Letra de la canción' })
  @IsOptional()
  @IsString()
  lyrics?: string;

  @ApiPropertyOptional({ example: 'G', description: 'Tonalidad' })
  @IsOptional()
  @IsString()
  songKey?: string;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(300)
  bpm?: number;

  @ApiPropertyOptional({ example: 354, description: 'Duración en segundos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 'Inglés' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'Rock' })
  @IsOptional()
  @IsString()
  genre?: string;
}

// ---------------------------------------------------------
// PATCH /songs/:id
// ---------------------------------------------------------
export class UpdateSongDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() artist?: string;
  @IsOptional() @IsString() author?: string;
  @IsOptional() @IsString() lyrics?: string;
  @IsOptional() @IsString() songKey?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(20) @Max(300) bpm?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) durationSeconds?: number;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() genre?: string;
}

// ---------------------------------------------------------
// GET (paginación + búsqueda)
// ---------------------------------------------------------
export class QuerySongsDto {
  @ApiPropertyOptional({ example: 'bohemian' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: false, description: 'Solo mis favoritas' })
  @IsOptional()
  @Type(() => Boolean)
  favoritesOnly?: boolean;

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
// PUT /songs/:id/notes/mine
// ---------------------------------------------------------
export class UpsertNoteDto {
  @IsString()
  @IsNotEmpty({ message: 'La nota no puede estar vacía' })
  content!: string;
}
