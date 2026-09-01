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
}
