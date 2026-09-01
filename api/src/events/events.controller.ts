// ============================================================
// EVENTS CONTROLLER — endpoints con doble validación
// ============================================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  QueryEventsDto,
  UpdateEventDto,
  SetAttendanceDto,
  AddSetlistToEventDto,
} from './dto/event.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('groups/:groupId/events')
  @Permissions('events.create')
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(groupId, user.sub, dto);
  }

  @Get('groups/:groupId/events')
  @Permissions('events.view')
  list(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryEventsDto,
  ) {
    return this.eventsService.listByGroup(groupId, user.sub, query);
  }

  @Get('events/:id')
  @Permissions('events.view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.findOne(id, user.sub);
  }

  @Patch('events/:id')
  @Permissions('events.edit')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.sub, dto);
  }

  @Delete('events/:id')
  @Permissions('events.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.remove(id, user.sub);
  }

  // ---------- ASISTENCIA (acciones personales) ----------
  @Put('events/:id/attend')
  @Permissions('events.view')
  setAttendance(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetAttendanceDto,
  ) {
    return this.eventsService.setAttendance(id, user.sub, dto.status);
  }

  @Delete('events/:id/attend')
  @Permissions('events.view')
  removeAttendance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.removeAttendance(id, user.sub);
  }

  // ---------- SETLISTS DEL EVENTO (gestión) ----------
  @Post('events/:id/setlists')
  @Permissions('events.edit')
  addSetlist(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddSetlistToEventDto,
  ) {
    return this.eventsService.addSetlist(id, dto.setlistId, user.sub);
  }

  @Delete('events/:id/setlists/:setlistId')
  @Permissions('events.edit')
  removeSetlist(
    @Param('id') id: string,
    @Param('setlistId') setlistId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.removeSetlist(id, setlistId, user.sub);
  }
}
