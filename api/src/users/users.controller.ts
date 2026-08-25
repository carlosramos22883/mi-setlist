// ============================================================
// USERS CONTROLLER — expone los endpoints protegidos
// ============================================================
// Orden importante: "me" va ANTES de ":id", si no Nest
// confundiría "me" con un id.
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
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  QueryUsersDto,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard) // primero auth, luego permisos
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // PATCH /users/me — cualquier autenticado (sin permiso especial)
  // DEBE ir antes de ":id" para que Nest no confunda "me" con un UUID
  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user.sub, dto);
  }

  // GET /users — requiere permiso users.view
  @Permissions('users.view')
  @Get()
  list(@Query() query: QueryUsersDto) {
    return this.users.list(query);
  }

  // POST /users — requiere permiso users.create
  @Permissions('users.create')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  // PATCH /users/:id — requiere permiso users.edit
  @Permissions('users.edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  // DELETE /users/:id — requiere permiso users.delete
  @Permissions('users.delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.users.remove(id, user.sub);
  }
}
