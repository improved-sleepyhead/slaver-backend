import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';

import { CreateDefectDto, UpdateDefectDto } from './dto/defect.dto';
import { UpdateDefectOrderDto } from './dto/bulk-update.dto';
import { DefectStatus, DefectPriority, ProjectRole } from '@prisma/client';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { DefectService } from './defect.service';
import { ProjectAuth } from 'src/common/decorators/project-auth.decorator';


@Controller('defects')
export class DefectController {
  constructor(private readonly defectService: DefectService) {}

  // 1. Создать дефект
  // POST /defects
  // (Здесь нельзя использовать ProjectAuth напрямую, т.к. projectId в body,
  // поэтому полагаемся на логику внутри сервиса или Guards, но проще проверить членство в сервисе)
  @Post()
  @Auth()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() dto: CreateDefectDto,
    @CurrentUser('id') userId: string,
  ) {
    // В идеале здесь нужен Guard, проверяющий доступ юзера к dto.projectId
    return this.defectService.create(dto, userId);
  }

  // 2. Получить список дефектов ПРОЕКТА
  // GET /defects/project/:projectId
  @Get('project/:projectId')
  @ProjectAuth() // Проверяет, что юзер участник проекта :projectId
  async getAllByProject(
    @Param('projectId') projectId: string,
    @Query('status') status?: DefectStatus,
    @Query('priority') priority?: DefectPriority,
    @Query('search') search?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.defectService.getAllByProject(projectId, {
      status,
      priority,
      search,
      assigneeId,
    });
  }

  // 3. Получить один дефект
  @Get(':id')
  @Auth()
  async getById(@Param('id') id: string) {
    // Тут хорошо бы проверить, имеет ли юзер доступ к проекту этого дефекта
    return this.defectService.getById(id);
  }

  // 4. Обновить дефект
  @Patch(':id')
  @Auth()
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDefectDto,
  ) {
    return this.defectService.update(id, dto);
  }

  // 5. Канбан: Обновить порядок/статусы пачкой
  @Patch('project/:projectId/reorder')
  @ProjectAuth() // Любой участник может двигать карточки (или ограничить MANAGER/ENGINEER)
  @HttpCode(204)
  async updateOrder(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateDefectOrderDto,
  ) {
    return this.defectService.updateOrder(projectId, dto);
  }

  // 6. Удалить дефект
  @Delete(':id')
  @Auth()
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.defectService.delete(id);
  }
}