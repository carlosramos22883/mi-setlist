// ============================================================
// SONGS SERVICE — CRUD de canciones con doble validación
// ============================================================
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSongDto, QuerySongsDto, UpdateSongDto } from './dto/song.dto';

@Injectable()
export class SongsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // POST /groups/:groupId/songs — crear (owner/admin)
  // ---------------------------------------------------------
  async create(groupId: string, userId: string, dto: CreateSongDto) {
    await this.assertGroupActive(groupId);
    await this.assertManage(groupId, userId);

    return this.prisma.song.create({
      data: { ...dto, groupId, createdById: userId },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  // ---------------------------------------------------------
  // GET /groups/:groupId/songs — listar (miembros)
  // ---------------------------------------------------------
  async listByGroup(groupId: string, userId: string, query: QuerySongsDto) {
    await this.assertGroupActive(groupId);
    await this.assertMember(groupId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      groupId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                title: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                artist: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                genre: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [songs, total] = await Promise.all([
      this.prisma.song.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true } },
          categories: { include: { category: true } },
        },
      }),
      this.prisma.song.count({ where }),
    ]);

    // ¿Cuáles de estas canciones son favoritas del usuario?
    const favs = await this.prisma.favoriteSong.findMany({
      where: { userId, songId: { in: songs.map((s) => s.id) } },
      select: { songId: true },
    });
    const favSet = new Set(favs.map((f) => f.songId));

    return {
      data: songs.map((s) => ({
        ...s,
        categories: s.categories.map((i) => i.category), // 🆕 chips en la UI
        isFavorite: favSet.has(s.id), // 🆕 corazón en la UI
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------
  // GET /songs/:id — detalle (miembros)
  // ---------------------------------------------------------
  async findOne(songId: string, userId: string) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        categories: { include: { category: true } },
        favorites: { where: { userId }, select: { userId: true } }, // la mía
        _count: { select: { favorites: true } }, // total
      },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');

    await this.assertMember(song.groupId, userId);

    const { favorites, _count, categories, ...rest } = song;
    return {
      ...rest,
      categories: categories.map((i) => i.category),
      isFavorite: favorites.length > 0,
      favoriteCount: _count.favorites,
    };
  }

  // ---------------------------------------------------------
  // PATCH /songs/:id — editar (owner/admin)
  // ---------------------------------------------------------
  async update(songId: string, userId: string, dto: UpdateSongDto) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, deletedAt: null },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');

    await this.assertManage(song.groupId, userId);

    return this.prisma.song.update({
      where: { id: songId },
      data: dto,
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  // ---------------------------------------------------------
  // DELETE /songs/:id — soft delete (owner/admin)
  // ---------------------------------------------------------
  async remove(songId: string, userId: string) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, deletedAt: null },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');

    await this.assertManage(song.groupId, userId);

    await this.prisma.song.update({
      where: { id: songId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Canción eliminada' };
  }

  // ---------------------------------------------------------
  // NOTAS PERSONALES (acciones personales: basta ser miembro)
  // ---------------------------------------------------------
  async getMyNote(songId: string, userId: string) {
    await this.assertSongAndMember(songId, userId);
    return this.prisma.songNote.findUnique({
      where: { songId_userId: { songId, userId } },
    });
  }

  async upsertMyNote(songId: string, userId: string, content: string) {
    await this.assertSongAndMember(songId, userId);
    return this.prisma.songNote.upsert({
      where: { songId_userId: { songId, userId } },
      update: { content },
      create: { songId, userId, content },
    });
  }

  async deleteMyNote(songId: string, userId: string) {
    await this.assertSongAndMember(songId, userId);
    await this.prisma.songNote.deleteMany({ where: { songId, userId } });
    return { message: 'Nota eliminada' };
  }

  // ---------------------------------------------------------
  // FAVORITAS (acciones personales)
  // ---------------------------------------------------------
  async addFavorite(songId: string, userId: string) {
    await this.assertSongAndMember(songId, userId);
    await this.prisma.favoriteSong.upsert({
      where: { userId_songId: { userId, songId } },
      update: {},
      create: { userId, songId },
    });
    return { message: 'Agregada a favoritas' };
  }

  async removeFavorite(songId: string, userId: string) {
    await this.assertSongAndMember(songId, userId);
    await this.prisma.favoriteSong.deleteMany({ where: { userId, songId } });
    return { message: 'Quitada de favoritas' };
  }

  // IDs de mis favoritas dentro de un grupo (para el filtro de la UI)
  async listMyFavoriteIds(groupId: string, userId: string) {
    await this.assertGroupActive(groupId);
    await this.assertMember(groupId, userId);
    const favs = await this.prisma.favoriteSong.findMany({
      where: { userId, song: { groupId, deletedAt: null } },
      select: { songId: true },
    });
    return favs.map((f) => f.songId);
  }

  // Helper: canción existe + usuario es miembro de su grupo
  private async assertSongAndMember(songId: string, userId: string) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, deletedAt: null },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');
    await this.assertMember(song.groupId, userId);
    return song;
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
