// ============================================================
// GROUPS CONTROLLER — endpoints de gestión de grupos
// ============================================================
// NOTA: estos endpoints NO usan el RBAC global (users.*, roles.*).
// Los permisos aquí son CONTEXTUALES: ¿qué rol tienes en ESTE grupo?
// El guard de membresía valida pertenencia y rol en cada request.
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
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  InviteMemberDto,
  QueryGroupsDto,
  UpdateGroupDto,
  UpdateMemberRoleDto,
} from './dto/group.dto';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  // POST /groups — crear grupo
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    return this.groups.create(user.sub, dto);
  }

  // GET /groups — listar mis grupos
  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: QueryGroupsDto) {
    return this.groups.listMyGroups(user.sub, query);
  }

  // GET /groups/:id — detalle del grupo
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groups.findOne(id, user.sub);
  }

  // PATCH /groups/:id — editar grupo
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groups.update(id, user.sub, dto);
  }

  // DELETE /groups/:id — eliminar grupo
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groups.remove(id, user.sub);
  }

  // POST /groups/:id/members — invitar usuario
  @Post(':id/members')
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteMemberDto,
  ) {
    return this.groups.inviteMember(id, user.sub, dto);
  }

  // PATCH /groups/:id/members/:memberId — cambiar rol
  @Patch(':id/members/:memberId')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.groups.updateMemberRole(id, user.sub, memberId, dto);
  }

  // DELETE /groups/:id/members/:memberId — expulsar miembro
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groups.removeMember(id, user.sub, memberId);
  }

  // POST /groups/:id/leave — abandonar grupo
  @Post(':id/leave')
  leaveGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groups.leaveGroup(id, user.sub);
  }
}
