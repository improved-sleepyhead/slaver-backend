import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AddMemberDto, CreateProjectDto, UpdateMemberRoleDto, UpdateProjectDto } from './dto/project.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ProjectRole } from '@prisma/client';
import { ProjectAuth } from 'src/common/decorators/project-auth.decorator';
import { AcceptInviteDto, GenerateInviteDto } from './dto/invite.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // Создать проект (Доступно всем авторизованным юзерам)
  @Post()
  @Auth()
  create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
    return this.projectService.create(dto, userId);
  }

  // Получить список МОИХ проектов
  @Get()
  @Auth()
  getAll(@CurrentUser('id') userId: string) {
    return this.projectService.getAll(userId);
  }

  // Получить один проект (Доступно любому участнику проекта)
  @Get(':id')
  @ProjectAuth() 
  getById(@Param('id') id: string) {
    return this.projectService.getById(id);
  }

  // Статистика (Доступно любому участнику)
  // ИЛИ можно ограничить: @ProjectAuth(ProjectRole.MANAGER, ProjectRole.OBSERVER)
  @Get(':id/stats')
  @ProjectAuth()
  getStats(@Param('id') id: string) {
    return this.projectService.getStatistics(id);
  }

  // Обновить (Только Менеджер)
  @Patch(':id')
  @ProjectAuth(ProjectRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, dto);
  }

  // Удалить (Только Менеджер)
  @Delete(':id')
  @ProjectAuth(ProjectRole.MANAGER)
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.projectService.delete(id);
  }

  // === ИНВАЙТЫ ===

  // 1. Создать ссылку (Только Менеджер)
  @Post(':id/invite')
  @ProjectAuth(ProjectRole.MANAGER)
  async generateInvite(
    @Param('id') id: string,
    @Body() dto: GenerateInviteDto
  ) {
    const link = await this.projectService.generateInviteLink(id, dto.role);
    return { link };
  }

  // 2. Принять приглашение (Любой авторизованный юзер)
  // Этот метод не требует ProjectAuth, так как юзер еще НЕ в проекте
  @Post('accept-invite')
  @Auth()
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @CurrentUser('id') userId: string
  ) {
    return this.projectService.acceptInvite(dto.token, userId);
  }

  // === УЧАСТНИКИ ===

  // Добавить вручную (Только Менеджер)
  @Post(':id/members')
  @ProjectAuth(ProjectRole.MANAGER)
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.projectService.addMember(id, dto);
  }

  // Удалить участника (Только Менеджер)
  @Delete(':id/members/:userId')
  @ProjectAuth(ProjectRole.MANAGER)
  @HttpCode(204)
  removeMember(@Param('id') projectId: string, @Param('userId') userId: string) {
    return this.projectService.removeMember(projectId, userId);
  }
  
  // Изменить роль (Только Менеджер)
  @Patch(':id/members/:userId')
  @ProjectAuth(ProjectRole.MANAGER)
  updateMemberRole(
      @Param('id') projectId: string, 
      @Param('userId') userId: string,
      @Body() dto: UpdateMemberRoleDto
  ) {
      return this.projectService.updateMemberRole(projectId, userId, dto.role);
  }
}