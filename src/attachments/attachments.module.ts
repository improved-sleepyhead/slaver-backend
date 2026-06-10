import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Импорт 1
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [ConfigModule], // <--- Импорт 2: Добавляем модуль конфигурации
  controllers: [AttachmentsController],
  providers: [AttachmentsService, PrismaService], // ConfigService из providers можно убрать, он придет из imports
})
export class AttachmentsModule {}