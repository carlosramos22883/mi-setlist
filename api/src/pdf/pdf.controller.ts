// ============================================================
// PDF CONTROLLER — descarga de PDFs con doble validación
// ============================================================
import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SongsService } from '../songs/songs.service';
import { SetlistsService } from '../setlists/setlists.service';
import { PdfService } from './pdf.service';

@ApiTags('pdf')
@ApiBearerAuth()
@Controller('pdf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly songsService: SongsService,
    private readonly setlistsService: SetlistsService,
  ) {}

  @Get('songs/:id')
  @Permissions('songs.view')
  async songPdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const song = await this.songsService.findOne(id, user.sub); // valida membresía
    const doc = this.pdfService.songPdf(song);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(song.title)}.pdf"`,
    );
    doc.pipe(res);
  }

  @Get('setlists/:id')
  @Permissions('setlists.view')
  async setlistPdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const setlist = await this.setlistsService.findOne(id, user.sub);
    const doc = this.pdfService.setlistPdf(setlist);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(setlist.name)}.pdf"`,
    );
    doc.pipe(res);
  }
}
