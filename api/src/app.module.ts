import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { UploadsModule } from './uploads/uploads.module';
import { GroupsModule } from './groups/groups.module';
import { SongsModule } from './songs/songs.module';
import { SetlistsModule } from './setlist/setlists.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    PublicModule,
    CommonModule,
    UsersModule,
    RolesModule,
    UploadsModule,
    GroupsModule,
    SongsModule,
    SetlistsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
