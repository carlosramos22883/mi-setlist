import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SongsModule } from '../songs/songs.module';
import { SetlistsModule } from '../setlists/setlists.module';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [AuthModule, SongsModule, SetlistsModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
