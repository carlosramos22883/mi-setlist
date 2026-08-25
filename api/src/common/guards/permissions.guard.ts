// ============================================================
// PERMISSIONS GUARD — el "portero" de permisos
// ============================================================
// Corre DESPUÉS del JwtAuthGuard (que ya autenticó al usuario
// y dejó su payload en request.user).
//
// Su trabajo:
// 1) Leer qué permisos exige la ruta (del decorator @Permissions)
// 2) Cargar los permisos del usuario desde la BD
//    (user → roles → permisos)
// 3) Si tiene TODOS los permisos requeridos → deja pasar (true)
// 4) Si le falta alguno → lanza 403 Forbidden
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { JwtPayload } from '../../auth/jwt-payload';
// Request de Express con nuestro usuario tipado
type AuthRequest = Request & { user?: JwtPayload };

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    // Reflector: herramienta de Nest para leer metadata (decorators)
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1) ¿Qué permisos exige esta ruta?
    // getAllAndOverride busca en el método (handler) y en la clase
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no tiene @Permissions, dejamos pasar a todos
    if (!required || required.length === 0) return true;

    // 2) Sacamos el usuario del request (lo puso el JwtAuthGuard)
    //    Con <AuthRequest> le decimos a TS la forma del objeto → sin "any"
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user; // ahora es JwtPayload | undefined, NO any
    if (!user) throw new ForbiddenException('Sin permisos');

    // 3) Cargamos todos los permisos del usuario desde la BD
    //    user → user_roles → roles → role_permissions → permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    // Extraemos solo los nombres de los permisos en un Set (sin duplicados)
    const userPermissions = new Set(
      userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      ),
    );

    // 4) ¿Tiene TODOS los permisos requeridos?
    const hasAll = required.every((p) => userPermissions.has(p));
    if (!hasAll) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true; // deja pasar
  }
}
