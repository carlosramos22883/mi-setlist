// ============================================================
// EVENTS SERVICE — CRUD de eventos con doble validación
// ============================================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client'; // 🎓 tipado correcto, sin any
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEventDto,
  QueryEventsDto,
  UpdateEventDto,
} from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // POST /groups/:groupId/events — crear (owner/admin)
  // ---------------------------------------------------------
  async create(groupId: string, userId: string, dto: CreateEventDto) {
    await this.assertGroupActive(groupId);
    await this.assertManage(groupId, userId);

    if (dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior al inicio',
      );
    }

    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        groupId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  // ---------------------------------------------------------
  // GET /groups/:groupId/events — listar (miembros)
  // ---------------------------------------------------------
  async listByGroup(groupId: string, userId: string, query: QueryEventsDto) {
    await this.assertGroupActive(groupId);
    await this.assertMember(groupId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const now = new Date();

    const where: Prisma.EventWhereInput = {
      groupId,
      deletedAt: null,
      ...(query.upcoming === true ? { startsAt: { gte: now } } : {}),
      ...(query.upcoming === false ? { startsAt: { lt: now } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { startsAt: query.upcoming === false ? 'desc' : 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { attendees: true, setlists: true } },
          attendees: { where: { userId }, select: { status: true } }, // mi respuesta
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events.map((e) => {
        const { attendees, _count, ...rest } = e;
        return {
          ...rest,
          myStatus: attendees[0]?.status ?? null,
          attendeeCount: _count.attendees,
          setlistCount: _count.setlists,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------
  // GET /events/:id — detalle con asistentes y setlists (miembros)
  // ---------------------------------------------------------
  async findOne(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        attendees: {
          orderBy: { updatedAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatarPath: true } },
          },
        },
        setlists: {
          include: {
            setlist: { include: { _count: { select: { songs: true } } } },
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    await this.assertMember(event.groupId, userId);
    return event;
  }

  // ---------------------------------------------------------
  // PATCH /events/:id — editar (owner/admin)
  // ---------------------------------------------------------
  async update(eventId: string, userId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    await this.assertManage(event.groupId, userId);

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : event.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : event.endsAt;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior al inicio',
      );
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  // ---------------------------------------------------------
  // DELETE /events/:id — soft delete (owner/admin)
  // ---------------------------------------------------------
  async remove(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    await this.assertManage(event.groupId, userId);

    await this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Evento eliminado' };
  }

  // ---------------------------------------------------------
  // Helpers de permiso contextual
  // ---------------------------------------------------------
  private async assertGroupActive(groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
  }

  private async membership(groupId: string, userId: string) {
    const m = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (!m) throw new ForbiddenException('No eres miembro de este grupo');
    return m;
  }

  private async assertMember(groupId: string, userId: string) {
    await this.membership(groupId, userId);
  }

  private async assertManage(groupId: string, userId: string) {
    const m = await this.membership(groupId, userId);
    if (m.role !== 'owner' && m.role !== 'admin') {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
  }
}
