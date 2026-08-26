// ============================================================
// GROUPS SERVICE — lógica de gestión de grupos y membresías
// ============================================================
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreateGroupDto,
  InviteMemberDto,
  QueryGroupsDto,
  UpdateGroupDto,
  UpdateMemberRoleDto,
} from './dto/group.dto';
import { randomBytes } from 'node:crypto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // ---------------------------------------------------------
  // POST /groups — crear grupo (el usuario se vuelve owner)
  // ---------------------------------------------------------
  async create(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        logoPath: dto.logoPath,
        ownerId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return this.formatGroup(group);
  }

  // ---------------------------------------------------------
  // GET /groups — listar MIS grupos (donde soy miembro)
  // ---------------------------------------------------------
  async listMyGroups(userId: string, query: QueryGroupsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [memberships, total] = await Promise.all([
      this.prisma.groupMember.findMany({
        where: { userId, group: { deletedAt: null } },
        include: {
          group: {
            include: {
              _count: { select: { members: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.groupMember.count({
        where: { userId, group: { deletedAt: null } },
      }),
    ]);

    const data = memberships.map((m) => ({
      ...this.formatGroup(m.group),
      myRole: m.role, // el rol del usuario en este grupo
      memberCount: m.group._count.members,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------
  // GET /groups/:id — detalle del grupo con miembros
  // ---------------------------------------------------------
  async findOne(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!group) throw new NotFoundException('Grupo no encontrado');

    // Verificar que el usuario sea miembro
    const membership = group.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new ForbiddenException('No eres miembro de este grupo');
    }

    return {
      ...this.formatGroup(group),
      members: group.members.map((m) => ({
        id: m.id,
        user: m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      myRole: membership.role,
    };
  }

  // ---------------------------------------------------------
  // PATCH /groups/:id — editar grupo (owner/admin)
  // ---------------------------------------------------------
  async update(groupId: string, userId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    await this.checkPermission(groupId, userId, ['owner', 'admin']);

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        logoPath: dto.logoPath,
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return this.formatGroup(updated);
  }

  // ---------------------------------------------------------
  // DELETE /groups/:id — eliminar grupo (solo owner)
  // ---------------------------------------------------------
  async remove(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    await this.checkPermission(groupId, userId, ['owner']);

    // Soft delete: marcar como eliminado
    await this.prisma.group.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Grupo eliminado' };
  }

  // ---------------------------------------------------------
  // POST /groups/:id/members — invitar usuario
  // ---------------------------------------------------------
  async inviteMember(groupId: string, userId: string, dto: InviteMemberDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    await this.checkPermission(groupId, userId, ['owner', 'admin']);

    // Verificar si el usuario ya es miembro
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (invitedUser) {
      const existingMember = await this.prisma.groupMember.findFirst({
        where: { groupId, userId: invitedUser.id },
      });
      if (existingMember) {
        throw new ConflictException('Ese usuario ya es miembro del grupo');
      }
    }

    // Verificar si ya hay una invitación pendiente
    const existingInvitation = await this.prisma.groupInvitation.findFirst({
      where: { groupId, email: dto.email, status: 'pending' },
    });
    if (existingInvitation) {
      throw new ConflictException('Ya existe una invitación pendiente para ese correo');
    }

    // Crear invitación con token
    const token = randomBytes(32).toString('hex');
    const invitation = await this.prisma.groupInvitation.create({
      data: {
        groupId,
        email: dto.email,
        token,
        role: dto.role,
        invitedById: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
      include: {
        group: { select: { name: true } },
      },
    });

    // TODO: enviar correo de invitación (pendiente)
    // await this.mail.sendGroupInvitation(dto.email, group.name, token);

    return {
      message: 'Invitación enviada',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  // ---------------------------------------------------------
  // PATCH /groups/:id/members/:memberId — cambiar rol
  // ---------------------------------------------------------
  async updateMemberRole(
    groupId: string,
    userId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    // Solo el owner puede cambiar roles
    await this.checkPermission(groupId, userId, ['owner']);

    const member = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.groupId !== groupId) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // No se puede cambiar el rol del owner
    if (member.role === 'owner') {
      throw new BadRequestException('No se puede cambiar el rol del dueño');
    }

    const updated = await this.prisma.groupMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      id: updated.id,
      user: updated.user,
      role: updated.role,
      joinedAt: updated.joinedAt,
    };
  }

  // ---------------------------------------------------------
  // DELETE /groups/:id/members/:memberId — expulsar miembro
  // ---------------------------------------------------------
  async removeMember(groupId: string, userId: string, memberId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    await this.checkPermission(groupId, userId, ['owner', 'admin']);

    const member = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.groupId !== groupId) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // No se puede expulsar al owner
    if (member.role === 'owner') {
      throw new BadRequestException('No se puede expulsar al dueño');
    }

    await this.prisma.groupMember.delete({ where: { id: memberId } });

    return { message: 'Miembro eliminado' };
  }

  // ---------------------------------------------------------
  // POST /groups/:id/leave — abandonar grupo
  // ---------------------------------------------------------
  async leaveGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (!member) {
      throw new BadRequestException('No eres miembro de este grupo');
    }

    // El owner no puede abandonar (debe transferir propiedad primero)
    if (member.role === 'owner') {
      throw new BadRequestException(
        'El dueño no puede abandonar el grupo. Transfiere la propiedad primero.',
      );
    }

    await this.prisma.groupMember.delete({ where: { id: member.id } });

    return { message: 'Has abandonado el grupo' };
  }

  // ---------------------------------------------------------
  // Helper: verificar permiso dentro del grupo
  // ---------------------------------------------------------
  private async checkPermission(
    groupId: string,
    userId: string,
    allowedRoles: ('owner' | 'admin' | 'member')[],
  ) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (!member) {
      throw new ForbiddenException('No eres miembro de este grupo');
    }
    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
  }

  // ---------------------------------------------------------
  // Helper: formatear grupo para respuesta
  // ---------------------------------------------------------
  private formatGroup(group: any) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      logoPath: group.logoPath,
      ownerId: group.ownerId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
