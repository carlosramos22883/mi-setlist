// ============================================================
// CATEGORIES CONTROLLER — doble validación
// ============================================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CategoriesService } from './categories.service';

class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

class AddCategoryToSongDto {
  @IsString()
  categoryId!: string;
}

@ApiTags('categories')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('groups/:groupId/categories')
  @Permissions('categories.view')
  list(@Param('groupId') groupId: string, @CurrentUser() user: JwtPayload) {
    return this.categoriesService.listByGroup(groupId, user.sub);
  }

  @Post('groups/:groupId/categories')
  @Permissions('categories.create')
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(groupId, user.sub, dto);
  }

  @Patch('song-categories/:id')
  @Permissions('categories.edit')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, user.sub, dto);
  }

  @Delete('song-categories/:id')
  @Permissions('categories.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.categoriesService.remove(id, user.sub);
  }

  @Get('songs/:songId/categories')
  @Permissions('categories.view')
  listBySong(@Param('songId') songId: string, @CurrentUser() user: JwtPayload) {
    return this.categoriesService.listBySong(songId, user.sub);
  }

  @Post('songs/:songId/categories')
  @Permissions('categories.edit')
  addToSong(
    @Param('songId') songId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddCategoryToSongDto,
  ) {
    return this.categoriesService.addToSong(songId, dto.categoryId, user.sub);
  }

  @Delete('songs/:songId/categories/:categoryId')
  @Permissions('categories.edit')
  removeFromSong(
    @Param('songId') songId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.categoriesService.removeFromSong(songId, categoryId, user.sub);
  }
}
