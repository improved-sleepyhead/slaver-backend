import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

// Модули
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { DefectModule } from './defect/defect.module';
import { CommentModule } from './comment/comment.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { StatisticsModule } from './stats/stats.module';

@Module({
  imports: [
    // 0. Config (Global)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 1. Core Modules
    AuthModule,
    UserModule,

    // 2. Feature Modules
    ProjectModule,
    DefectModule,
    CommentModule,
    AttachmentsModule,
    StatisticsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}