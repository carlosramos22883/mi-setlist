// ============================================================
// GROUPS CONTROLLER — endpoints del CRUD de grupos
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
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  InviteMemberDto,
  QueryGroupsDto,
  UpdateGroupDto,
  UpdateMemberRoleDto,
} from './dto/group.dto';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Permissions('groups.create')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.sub, dto);
  }

  @Get()
  @Permissions('groups.view')
  listMyGroups(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryGroupsDto,
  ) {
    return this.groupsService.listMyGroups(user.sub, query);
  }

  @Get(':id')
  @Permissions('groups.view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.findOne(id, user.sub);
  }

  @Patch(':id')
  @Permissions('groups.edit')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @Permissions('groups.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.remove(id, user.sub);
  }

  @Post(':id/members')
  @Permissions('members.invite')
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(id, user.sub, dto);
  }

  @Patch(':id/members/:memberId')
  @Permissions('members.change_role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(id, user.sub, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @Permissions('members.remove')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeMember(id, user.sub, memberId);
  }

  @Post(':id/leave')
  leaveGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.leaveGroup(id, user.sub);
  }
}
