// ============================================================
// USERS SERVICE — lógica de negocio del CRUD de usuarios
// ============================================================
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreateUserDto,
  QueryUsersDto,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';

// Campos públicos que SIEMPRE devolvemos (nunca el passwordHash)
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { include: { role: { select: { id: true, name: true } } } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // ---------------------------------------------------------
  // GET /users — listado con búsqueda y paginación
  // ---------------------------------------------------------
  async list(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Filtro de búsqueda: por nombre O por email (case-insensitive)
    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Aplana la relación: en vez de { role: {...} } devolvemos solo el rol
    return {
      data: users.map((u) => ({
        ...u,
        roles: u.roles.map((ur) => ur.role),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------------------------------------------------------
  // POST /users — el admin crea; rol por defecto "Usuario"
  // ---------------------------------------------------------
  // Aunque lo cree el admin, el usuario DEBE verificar su correo
  // (igual que en el registro público). No confiamos ciegamente.
  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Ese correo ya está registrado');

    // Si no especificó roles, asignamos el rol "Usuario" por defecto
    let roleIds = dto.roleIds ?? [];
    if (roleIds.length === 0) {
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: 'Usuario' },
      });
      if (defaultRole) roleIds = [defaultRole.id];
    }

    // 1) Crear el usuario SIN verificar (emailVerifiedAt queda null)
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        // ⚠️ YA NO ponemos emailVerifiedAt: pasa por el proceso de correo
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      select: USER_SELECT,
    });

    // 2) Token de verificación (mismo patrón que el registro público)
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256').update(rawToken).digest('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    // 3) Enviar el correo de verificación al nuevo usuario
    const fullUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    await this.mail.sendVerificationEmail(fullUser, rawToken);

    return { ...user, roles: user.roles.map((ur) => ur.role) };
  }

  // ---------------------------------------------------------
  // PATCH /users/:id — el admin edita (puede cambiar roles)
  // ---------------------------------------------------------
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Si cambia el correo, verificar que no esté en uso
    const emailChanged = !!dto.email && dto.email !== user.email;
    if (emailChanged) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email! },
      });
      if (dup) throw new ConflictException('Ese correo ya está registrado');
    }

    // Construimos el objeto de datos dinámicamente
    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
    if (emailChanged) data.email = dto.email;

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({ where: { id }, data });
    }

    // Cambio de correo por el admin: no dispara re-verificación
    // (el admin ya validó al usuario)

    // Reasignar roles si se enviaron (sync completo)
    if (dto.roleIds) {
      await this.prisma.$transaction([
        this.prisma.userRole.deleteMany({ where: { userId: id } }),
        this.prisma.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        }),
      ]);
    }

    const updated = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    return {
      ...(updated as NonNullable<typeof updated>),
      roles: updated!.roles.map((ur) => ur.role),
    };
  }

  // ---------------------------------------------------------
  // DELETE /users/:id — el admin elimina
  // ---------------------------------------------------------
  async remove(id: string, requesterId: string) {
    if (id === requesterId) {
      // Protegemos al admin de eliminarse a sí mismo accidentalmente
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuario eliminado' };
  }

  // ---------------------------------------------------------
  // PATCH /users/me — el usuario edita su propio perfil
  // ---------------------------------------------------------
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const emailChanged = !!dto.email && dto.email !== user.email;
    if (emailChanged) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email! },
      });
      if (dup) throw new ConflictException('Ese correo ya está registrado');
    }

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data });
    }

    // Si cambia el correo: re-verificar + cerrar todas sus sesiones
    if (emailChanged) {
      await this.applyEmailChange(userId, dto.email!);
      return {
        message:
          'Perfil actualizado. Cerramos tu sesión y te enviamos un correo de verificación al nuevo correo.',
      };
    }

    return { message: 'Perfil actualizado' };
  }

  // ---------------------------------------------------------
  // Helper: cambia el correo, re-verifica y revoca sesiones
  // ---------------------------------------------------------
  private async applyEmailChange(userId: string, newEmail: string) {
    const rawToken = randomBytes(32).toString('hex');

    await this.prisma.$transaction([
      // Nuevo correo, sin verificar aún
      this.prisma.user.update({
        where: { id: userId },
        data: { email: newEmail, emailVerifiedAt: null },
      }),
      // Token de verificación para el nuevo correo
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: createHash('sha256').update(rawToken).digest('hex'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
      // "Sacar del sistema": revocar TODAS sus sesiones activas
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Envía el correo al NUEVO correo
    const updatedUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    await this.mail.sendVerificationEmail(updatedUser, rawToken);
  }
}
