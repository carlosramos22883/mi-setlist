// ============================================================
// ROLES SERVICE — lógica de gestión de roles y permisos
// ============================================================
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // GET /roles — lista roles con sus permisos y cuántos usuarios tienen
  // ---------------------------------------------------------
  async list() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }, // contador de usuarios con este rol
      },
    });

    // Aplana la respuesta: en vez de { permission: {...} } devuelve solo el permiso
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      usersCount: role._count.users,
      permissions: role.permissions.map((rp) => rp.permission),
    }));
  }

  // ---------------------------------------------------------
  // GET /permissions — catálogo completo de permisos agrupados
  // ---------------------------------------------------------
  // Devuelve { users: [...], roles: [...] } para que la UI
  // pueda renderizar checkboxes agrupados por recurso.
  async allPermissions() {
    const perms = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    // Agrupa por `group` (users, roles, etc.)
    const groups: Record<string, typeof perms> = {};
    for (const p of perms) {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    }
    return groups;
  }

  // ---------------------------------------------------------
  // PATCH /roles/:id — edita rol y sincroniza permisos
  // ---------------------------------------------------------
  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    // 🆕 REGLA: un rol no puede quedar sin permisos (no tendría sentido)
    if (dto.permissionIds && dto.permissionIds.length === 0) {
      throw new BadRequestException('Un rol debe tener al menos un permiso');
    }

    // Regla de seguridad: el Administrador SIEMPRE debe tener todos los permisos
    if (role.name === 'Administrador' && dto.permissionIds) {
      const total = await this.prisma.permission.count();
      if (dto.permissionIds.length < total) {
        throw new BadRequestException(
          'El rol Administrador debe conservar todos los permisos',
        );
      }
    }

    // Actualiza campos simples (nombre / descripción)
    if (dto.name || dto.description !== undefined) {
      await this.prisma.role.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
      });
    }

    // Sincroniza permisos: borra todos y crea los nuevos
    // (patrón "sync" común en RBAC)
    if (dto.permissionIds) {
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        this.prisma.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        }),
      ]);
    }

    // Devuelve el rol actualizado con sus permisos
    const updated = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    return {
      id: updated!.id,
      name: updated!.name,
      description: updated!.description,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
      usersCount: updated!._count.users,
      permissions: updated!.permissions.map((rp) => rp.permission),
    };
  }
}
