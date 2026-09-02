// ============================================================
// SETLISTS CONTROLLER — endpoints con doble validación
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
import { SetlistsService } from './setlists.service';
import {
  AddSongToSetlistDto,
  CreateSetlistDto,
  QuerySetlistsDto,
  ReorderSetlistDto,
  UpdateSetlistDto,
  UpdateSetlistSongDto,
} from './dto/setlist.dto';

@ApiTags('setlists')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SetlistsController {
  constructor(private readonly setlistsService: SetlistsService) {}

  @Post('groups/:groupId/setlists')
  @Permissions('setlists.create')
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSetlistDto,
  ) {
    return this.setlistsService.create(groupId, user.sub, dto);
  }

  @Get('groups/:groupId/setlists')
  @Permissions('setlists.view')
  list(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: QuerySetlistsDto,
  ) {
    return this.setlistsService.listByGroup(groupId, user.sub, query);
  }

  @Get('setlists/:id')
  @Permissions('setlists.view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.setlistsService.findOne(id, user.sub);
  }

  @Patch('setlists/:id')
  @Permissions('setlists.edit')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSetlistDto,
  ) {
    return this.setlistsService.update(id, user.sub, dto);
  }

  @Delete('setlists/:id')
  @Permissions('setlists.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.setlistsService.remove(id, user.sub);
  }

  @Post('setlists/:id/songs')
  @Permissions('setlists.edit')
  addSong(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddSongToSetlistDto,
  ) {
    return this.setlistsService.addSong(id, user.sub, dto);
  }

  @Delete('setlists/:id/songs/:songId')
  @Permissions('setlists.edit')
  removeSong(
    @Param('id') id: string,
    @Param('songId') songId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.setlistsService.removeSong(id, songId, user.sub);
  }

  @Patch('setlists/:id/songs/:songId')
  @Permissions('setlists.edit')
  updateSong(
    @Param('id') id: string,
    @Param('songId') songId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSetlistSongDto,
  ) {
    return this.setlistsService.updateSong(id, songId, user.sub, dto);
  }

  @Patch('setlists/:id/reorder')
  @Permissions('setlists.edit')
  reorder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReorderSetlistDto,
  ) {
    return this.setlistsService.reorder(id, user.sub, dto);
  }
}
