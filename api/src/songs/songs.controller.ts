// ============================================================
// SONGS CONTROLLER — endpoints con doble validación
// ============================================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SongsService } from './songs.service';
import { CreateSongDto, QuerySongsDto, UpdateSongDto } from './dto/song.dto';

@ApiTags('songs')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  // Capa global: songs.create | Contextual: owner/admin
  @Post('groups/:groupId/songs')
  @Permissions('songs.create')
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSongDto,
  ) {
    return this.songsService.create(groupId, user.sub, dto);
  }

  // Capa global: songs.view | Contextual: miembro
  @Get('groups/:groupId/songs')
  @Permissions('songs.view')
  list(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: QuerySongsDto,
  ) {
    return this.songsService.listByGroup(groupId, user.sub, query);
  }

  @Get('songs/:id')
  @Permissions('songs.view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.songsService.findOne(id, user.sub);
  }

  @Patch('songs/:id')
  @Permissions('songs.edit')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSongDto,
  ) {
    return this.songsService.update(id, user.sub, dto);
  }

  @Delete('songs/:id')
  @Permissions('songs.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.songsService.remove(id, user.sub);
  }
}
