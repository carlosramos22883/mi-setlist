// ============================================================
// ROLES CONTROLLER — endpoints de gestión de roles y permisos
// ============================================================
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  // GET /roles — lista roles (con permisos y conteo de usuarios)
  @Permissions('roles.view')
  @Get('roles')
  list() {
    return this.roles.list();
  }

  // GET /permissions — catálogo agrupado para la UI
  @Permissions('roles.view')
  @Get('permissions')
  permissions() {
    return this.roles.allPermissions();
  }

  // PATCH /roles/:id — edita rol / permisos
  @Permissions('roles.edit')
  @Patch('roles/:id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }
}
