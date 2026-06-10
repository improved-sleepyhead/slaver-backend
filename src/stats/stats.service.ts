import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProjectStatsView, UserStatsView } from './dto/stats.dto';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  // 1. Получить статистику по проекту (Мгновенно из MV)
  async getProjectStats(projectId: string): Promise<ProjectStatsView> {
    // ВАЖНО: BigInt из Postgres возвращается как n (10n), JSON.stringify это ломает.
    // Поэтому кастим count-ы в int внутри SQL или обрабатываем здесь.
    // Используем SQL cast ::int для упрощения.
    
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        project_id,
        total_defects::int,
        active_defects::int,
        closed_defects::int,
        overdue_defects::int,
        progress_percentage::float
      FROM "project_stats_mv"
      WHERE project_id = ${projectId}
      LIMIT 1;
    `;

    return result[0] || {
        project_id: projectId,
        total_defects: 0,
        active_defects: 0,
        closed_defects: 0,
        overdue_defects: 0,
        progress_percentage: 0
    };
  }

  // 2. Получить рейтинг участников проекта (Мгновенно из MV)
  async getProjectUsersStats(projectId: string): Promise<UserStatsView[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        user_id,
        user_name,
        user_email,
        total_assigned::int,
        completed::int,
        overdue::int,
        efficiency_rate::float
      FROM "user_project_stats_mv"
      WHERE project_id = ${projectId}
      ORDER BY efficiency_rate DESC, completed DESC; 
    `;
    
    return result;
  }

  // 3. CRON: Обновление статистики раз в 10 минут
  // Можно настроить чаще, если ресурсы позволяют
  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshMaterializedViews() {
    console.log('🔄 Refreshing Statistics Views...');
    
    // REFRESH MATERIALIZED VIEW CONCURRENTLY позволяет читать данные во время обновления
    // Но требует Unique Index (мы его создали в миграции)
    await this.prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY "project_stats_mv"`);
    await this.prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY "user_project_stats_mv"`);
    
    console.log('✅ Statistics Views Refreshed');
  }

  // Метод для ручного обновления (например, при завершении крупного этапа)
  async forceRefresh() {
    await this.refreshMaterializedViews();
    return { message: 'Statistics refreshed successfully' };
  }
}