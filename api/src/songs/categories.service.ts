// ============================================================
// CATEGORIES SERVICE — categorías por grupo + vínculo con canciones
// ============================================================
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /groups/:groupId/categories
  async listByGroup(groupId: string, userId: string) {
    await this.assertMember(groupId, userId);
    return this.prisma.songCategory.findMany({
      where: { groupId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { songs: true } } },
    });
  }

  // POST /groups/:groupId/categories (owner/admin)
  async create(groupId: string, userId: string, dto: { name: string; color?: string }) {
    await this.assertManage(groupId, userId);

    const exists = await this.prisma.songCategory.findUnique({
      where: { groupId_name: { groupId, name: dto.name } },
    });
    if (exists) throw new ConflictException('Ya existe una categoría con ese nombre');

    return this.prisma.songCategory.create({
      data: { groupId, name: dto.name, color: dto.color },
    });
  }

  // PATCH /song-categories/:id (owner/admin)
  async update(categoryId: string, userId: string, dto: { name?: string; color?: string }) {
    const category = await this.prisma.songCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    await this.assertManage(category.groupId, userId);

    if (dto.name) {
      const dup = await this.prisma.songCategory.findUnique({
        where: { groupId_name: { groupId: category.groupId, name: dto.name } },
      });
      if (dup && dup.id !== categoryId) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    return this.prisma.songCategory.update({ where: { id: categoryId }, data: dto });
  }

  // DELETE /song-categories/:id (owner/admin)
  async remove(categoryId: string, userId: string) {
    const category = await this.prisma.songCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    await this.assertManage(category.groupId, userId);

    await this.prisma.songCategory.delete({ where: { id: categoryId } });
    return { message: 'Categoría eliminada' };
  }

  // GET /songs/:songId/categories
  async listBySong(songId: string, userId: string) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, deletedAt: null },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');
    await this.assertMember(song.groupId, userId);

    const items = await this.prisma.songCategoryItem.findMany({
      where: { songId },
      include: { category: true },
    });
    return items.map((i) => i.category);
  }

  // POST /songs/:songId/categories (owner/admin)
  async addToSong(songId: string, categoryId: string, userId: string) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, deletedAt: null },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');
    await this.assertManage(song.groupId, userId);

    const category = await this.prisma.songCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.groupId !== song.groupId) {
      throw new NotFoundException('La categoría no pertenece a este grupo');
    }

    await this.prisma.songCategoryItem.upsert({
      where: { songId_categoryId: { songId, categoryId } },
      update: {},
      create: { songId, categoryId },
    });
    return { message: 'Categoría agregada' };
  }

  // DELETE /songs/:songId/categories/:categoryId (owner/admin)
  async removeFromSong(songId: string, categoryId: string, userId: string) {
    const song = await this.prisma.song.findFirst({ where: { id: songId, deletedAt: null } });
    if (!song) throw new NotFoundException('Canción no encontrada');
    await this.assertManage(song.groupId, userId);

    await this.prisma.songCategoryItem.deleteMany({
      where: { songId, categoryId },
    });
    return { message: 'Categoría quitada' };
  }

  // ---------------------------------------------------------
  // Helpers contextuales
  // ---------------------------------------------------------
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