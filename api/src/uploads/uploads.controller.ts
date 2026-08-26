// ============================================================
// UPLOADS CONTROLLER — subir y servir archivos propios
// ============================================================
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  // POST /api/v1/uploads/image — autenticado: sube y normaliza imagen
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }), // 5 MB
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debes enviar un archivo en el campo "file"');
    }
    const path = await this.uploads.saveSquareImage(file.buffer, file.mimetype);
    return { path }; // ej: { "path": "uploads/abc-123.png" }
  }

  // GET /api/v1/uploads/:filename — público (como el logo)
  @Get(':filename')
  serve(@Param('filename') filename: string, @Res() res: Response) {
    res.sendFile(this.uploads.resolve(filename));
  }
}
