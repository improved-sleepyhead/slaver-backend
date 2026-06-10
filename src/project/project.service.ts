import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AddMemberDto, CreateProjectDto, ProjectStatsDto, UpdateProjectDto } from './dto/project.dto';
import { DefectStatus, ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Создание проекта
  async create(dto: CreateProjectDto, ownerId: string) {
    return this.prisma.project.create({
      data: {
        ...dto,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: ProjectRole.MANAGER, // Создатель сразу становится Менеджером
          },
        },
      },
    });
  }

  // Получить один проект (Права проверяет Guard, тут просто запрос)
  async getById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }

  // Получить все проекты пользователя
  async getAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        // Подгружаем кол-во дефектов для списка
        _count: {
          select: { defects: true },
        },
      },
    });
  }

  // Статистика (Оптимизировано)
  async getStatistics(projectId: string): Promise<ProjectStatsDto> {
    const now = new Date();

    // Группировка по статусам (1 запрос вместо 5)
    const statusCounts = await this.prisma.defect.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { id: true },
    });

    // Подсчет просроченных (отдельный запрос)
    const overdueCount = await this.prisma.defect.count({
      where: {
        projectId,
        status: { notIn: [DefectStatus.CLOSED, DefectStatus.CANCELED] },
        dueDate: { lt: now },
      },
    });

    let totalDefects = 0;
    let activeDefects = 0;
    let closedDefects = 0;

    statusCounts.forEach((s) => {
      const count = s._count.id;
      totalDefects += count;
      if (s.status === DefectStatus.CLOSED || s.status === DefectStatus.CANCELED) {
        closedDefects += count;
      } else {
        activeDefects += count; // NEW, IN_PROGRESS, ON_CHECK
      }
    });

    return {
      totalDefects,
      activeDefects,
      closedDefects,
      overdueDefects: overdueCount,
    };
  }

  async update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  // НОВЫЙ МЕТОД: Обновление роли участника
  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    // Проверяем, существует ли участник
    const member = await this.prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!member) {
      throw new NotFoundException('Участник не найден в этом проекте');
    }

    // Нельзя менять роль владельцу проекта (опциональная защита)
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (project && project.ownerId === userId) {
        throw new BadRequestException('Нельзя изменить роль владельца проекта');
    }

    return this.prisma.projectUser.update({
      where: {
        userId_projectId: { userId, projectId },
      },
      data: { role },
    });
  }

   // --- ЛОГИКА ПРИГЛАШЕНИЙ ---

  // 1. Генерация ссылки
  async generateInviteLink(projectId: string, role: ProjectRole): Promise<string> {
    const payload = { projectId, role };
    // Токен валиден 7 дней
    const token = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    // Получаем базовый URL фронтенда из .env
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';
    
    // Формируем ссылку, на которую перейдет юзер
    return `${clientUrl}/projects/join?token=${token}`;
  }

  // 2. Принятие приглашения
  async acceptInvite(token: string, userId: string) {
    try {
      // Верификация (если истек или подделан — вылетит ошибка)
      const payload = await this.jwtService.verifyAsync(token);
      const { projectId, role } = payload;

      // Проверяем существование проекта
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true }
      });

      if (!project) throw new NotFoundException('Проект не найден');

      // Проверяем, не является ли юзер уже участником
      const existingMember = await this.prisma.projectUser.findUnique({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      if (existingMember) {
        throw new BadRequestException('Вы уже являетесь участником этого проекта');
      }

      // Добавляем участника
      await this.prisma.projectUser.create({
        data: {
          userId,
          projectId,
          role: role || ProjectRole.ENGINEER, // Фолбек на инженера
        },
      });

      return project; // Возвращаем инфо о проекте, куда вступили
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) {
        throw e;
      }
      throw new BadRequestException('Ссылка приглашения недействительна или истекла');
    }
  }

  // --- УПРАВЛЕНИЕ УЧАСТНИКАМИ (Ручное) ---

  async addMember(projectId: string, dto: AddMemberDto) {
    const exists = await this.prisma.projectUser.findUnique({
      where: { userId_projectId: { userId: dto.userId, projectId } },
    });
    if (exists) throw new BadRequestException('Пользователь уже в проекте');

    return this.prisma.projectUser.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async removeMember(projectId: string, userId: string) {
    // Нельзя удалить владельца
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (project && project.ownerId === userId) {
        throw new BadRequestException('Нельзя удалить владельца проекта');
    }

    return this.prisma.projectUser.delete({
      where: {
        userId_projectId: { projectId, userId },
      },
    });
  }
}