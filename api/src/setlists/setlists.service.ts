// ============================================================
// SETLISTS SERVICE — CRUD + gestión de canciones
// ============================================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddSongToSetlistDto,
  CreateSetlistDto,
  QuerySetlistsDto,
  ReorderSetlistDto,
  UpdateSetlistDto,
  UpdateSetlistSongDto,
} from './dto/setlist.dto';

@Injectable()
export class SetlistsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // POST /groups/:groupId/setlists — crear (owner/admin)
  // ---------------------------------------------------------
  async create(groupId: string, userId: string, dto: CreateSetlistDto) {
    await this.assertGroupActive(groupId);
    await this.assertManage(groupId, userId);

    return this.prisma.setlist.create({
      data: { ...dto, groupId, createdById: userId },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  // ---------------------------------------------------------
  // GET /groups/:groupId/setlists — listar (miembros)
  // ---------------------------------------------------------
  async listByGroup(groupId: string, userId: string, query: QuerySetlistsDto) {
    await this.assertGroupActive(groupId);
    await this.assertMember(groupId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      groupId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [setlists, total] = await Promise.all([
      this.prisma.setlist.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { songs: true } },
        },
      }),
      this.prisma.setlist.count({ where }),
    ]);

    return {
      data: setlists.map((s) => ({ ...s, songCount: s._count.songs })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------
  // GET /setlists/:id — detalle con canciones ordenadas (miembros)
  // ---------------------------------------------------------
  async findOne(setlistId: string, userId: string) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        songs: {
          orderBy: { position: 'asc' },
          include: {
            song: {
              include: { createdBy: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertMember(setlist.groupId, userId);
    return setlist;
  }

  // ---------------------------------------------------------
  // PATCH /setlists/:id — editar (owner/admin)
  // ---------------------------------------------------------
  async update(setlistId: string, userId: string, dto: UpdateSetlistDto) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertManage(setlist.groupId, userId);

    return this.prisma.setlist.update({
      where: { id: setlistId },
      data: dto,
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  // ---------------------------------------------------------
  // DELETE /setlists/:id — soft delete (owner/admin)
  // ---------------------------------------------------------
  async remove(setlistId: string, userId: string) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertManage(setlist.groupId, userId);

    await this.prisma.setlist.update({
      where: { id: setlistId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Setlist eliminado' };
  }

  // ---------------------------------------------------------
  // POST /setlists/:id/songs — agregar canción (owner/admin)
  // ---------------------------------------------------------
  async addSong(setlistId: string, userId: string, dto: AddSongToSetlistDto) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertManage(setlist.groupId, userId);

    // Verificar que la canción exista y pertenezca al mismo grupo
    const song = await this.prisma.song.findFirst({
      where: { id: dto.songId, groupId: setlist.groupId, deletedAt: null },
    });
    if (!song)
      throw new NotFoundException('Canción no encontrada en este grupo');

    // Verificar que no esté ya en el setlist
    const existing = await this.prisma.setlistSong.findUnique({
      where: { setlistId_songId: { setlistId, songId: dto.songId } },
    });
    if (existing)
      throw new BadRequestException('La canción ya está en el setlist');

    // Obtener la posición máxima actual
    const maxPosition = await this.prisma.setlistSong.aggregate({
      where: { setlistId },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? 0) + 1;

    return this.prisma.setlistSong.create({
      data: {
        setlistId,
        songId: dto.songId,
        position: nextPosition,
        customKey: dto.customKey,
        notes: dto.notes,
      },
      include: { song: true },
    });
  }

  // ---------------------------------------------------------
  // DELETE /setlists/:id/songs/:songId — quitar canción (owner/admin)
  // ---------------------------------------------------------
  async removeSong(setlistId: string, songId: string, userId: string) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertManage(setlist.groupId, userId);

    const link = await this.prisma.setlistSong.findUnique({
      where: { setlistId_songId: { setlistId, songId } },
    });
    if (!link) throw new NotFoundException('Canción no está en el setlist');

    await this.prisma.setlistSong.delete({ where: { id: link.id } });
    return { message: 'Canción removida del setlist' };
  }

  // ---------------------------------------------------------
  // PATCH /setlists/:id/songs/:songId — editar canción en setlist (owner/admin)
  // ---------------------------------------------------------
  async updateSong(
    setlistId: string,
    songId: string,
    userId: string,
    dto: UpdateSetlistSongDto,
  ) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertManage(setlist.groupId, userId);

    const link = await this.prisma.setlistSong.findUnique({
      where: { setlistId_songId: { setlistId, songId } },
    });
    if (!link) throw new NotFoundException('Canción no está en el setlist');

    return this.prisma.setlistSong.update({
      where: { id: link.id },
      data: dto,
      include: { song: true },
    });
  }

  // ---------------------------------------------------------
  // PATCH /setlists/:id/reorder — reordenar canciones (owner/admin)
  // ---------------------------------------------------------
  async reorder(setlistId: string, userId: string, dto: ReorderSetlistDto) {
    const setlist = await this.prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });
    if (!setlist) throw new NotFoundException('Setlist no encontrado');

    await this.assertManage(setlist.groupId, userId);

    // Actualizar cada posición en una transacción
    await this.prisma.$transaction(
      dto.songs.map((item) =>
        this.prisma.setlistSong.updateMany({
          where: { setlistId, songId: item.songId },
          data: { position: item.position },
        }),
      ),
    );

    return this.prisma.setlistSong.findMany({
      where: { setlistId },
      orderBy: { position: 'asc' },
      include: { song: true },
    });
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
