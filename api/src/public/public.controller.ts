// ============================================================
// PUBLIC CONTROLLER — recursos públicos sin autenticación
// ============================================================
import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as path from 'node:path';

@ApiTags('public')
@Controller('public')
export class PublicController {
  // GET /api/v1/public/logo
  // Sirve el logo para usarlo en correos y en la web.
  // process.cwd() = la carpeta api/ cuando corres npm run start:dev
  @Get('logo')
  logo(@Res() res: Response) {
    res.sendFile(path.join(process.cwd(), 'assets', 'logo.png'));
  }
}
