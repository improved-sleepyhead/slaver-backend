import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { StatisticsService } from './stats.service';
import { ProjectAuth } from 'src/common/decorators/project-auth.decorator';

@Controller('projects/:projectId/statistics')
export class StatisticsController {
  constructor(private readonly statsService: StatisticsService) {}

  // Общая статистика по проекту
  // Доступно всем участникам проекта (включая заказчика)
  @Get('general')
  @ProjectAuth() 
  async getProjectStats(@Param('projectId') projectId: string) {
    return this.statsService.getProjectStats(projectId);
  }

  // Эффективность команды (Кто сколько сделал)
  @Get('team')
  @ProjectAuth(ProjectRole.MANAGER, ProjectRole.OBSERVER) // Инженерам чужую стату видеть не обязательно
  async getTeamStats(@Param('projectId') projectId: string) {
    return this.statsService.getProjectUsersStats(projectId);
  }

  // Принудительное обновление статистики (Только админ или менеджер)
  // Полезно, если только что загрузили кучу дефектов и хотят видеть отчет сразу
  @Post('refresh')
  @ProjectAuth(ProjectRole.MANAGER)
  async forceRefresh() {
    return this.statsService.forceRefresh();
  }
}