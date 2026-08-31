// ============================================================
// DTOs del módulo de setlists
// ============================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------
// POST /groups/:groupId/setlists
// ---------------------------------------------------------
export class CreateSetlistDto {
  @ApiProperty({ example: 'Ensayo Viernes' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// ---------------------------------------------------------
// PATCH /setlists/:id
// ---------------------------------------------------------
export class UpdateSetlistDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// ---------------------------------------------------------
// POST /setlists/:id/songs — agregar canción al setlist
// ---------------------------------------------------------
export class AddSongToSetlistDto {
  @ApiProperty({ description: 'ID de la canción a agregar' })
  @IsString()
  @IsNotEmpty()
  songId!: string;

  @ApiPropertyOptional({
    description: 'Tonalidad específica para este setlist',
  })
  @IsOptional()
  @IsString()
  customKey?: string;

  @ApiPropertyOptional({ description: 'Notas específicas para este setlist' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ---------------------------------------------------------
// PATCH /setlists/:id/songs/:songId — editar canción en setlist
// ---------------------------------------------------------
export class UpdateSetlistSongDto {
  @ApiPropertyOptional({ description: 'Tonalidad específica' })
  @IsOptional()
  @IsString()
  customKey?: string;

  @ApiPropertyOptional({ description: 'Notas específicas' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ---------------------------------------------------------
// PATCH /setlists/:id/reorder — reordenar canciones
// ---------------------------------------------------------
class ReorderItem {
  @IsString()
  @IsNotEmpty()
  songId!: string;

  @IsInt()
  @Min(1)
  position!: number;
}

export class ReorderSetlistDto {
  @ApiProperty({ type: [ReorderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  songs!: ReorderItem[];
}

// ---------------------------------------------------------
// GET (paginación + búsqueda)
// ---------------------------------------------------------
export class QuerySetlistsDto {
  @ApiPropertyOptional({ example: 'ensayo' })
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
