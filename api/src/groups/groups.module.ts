// ============================================================
// GROUPS MODULE
// ============================================================
import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
