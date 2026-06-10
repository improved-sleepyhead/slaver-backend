import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ScheduleModule } from '@nestjs/schedule'; // Для CRON
import { StatisticsController } from './stats.controller';
import { StatisticsService } from './stats.service';

@Module({
  imports: [
    ScheduleModule.forRoot() // Подключаем планировщик задач
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService, PrismaService],
})
export class StatisticsModule {}