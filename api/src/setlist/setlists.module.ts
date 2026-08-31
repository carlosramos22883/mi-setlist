import { Module } from '@nestjs/common';
import { SetlistsController } from './setlists.controller';
import { SetlistsService } from './setlists.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SetlistsController],
  providers: [SetlistsService],
})
export class SetlistsModule {}
