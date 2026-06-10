import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDefectDto, UpdateDefectDto } from './dto/defect.dto';
import { UpdateDefectOrderDto } from './dto/bulk-update.dto';
import { DefectPriority, DefectStatus, Prisma } from '@prisma/client';
import { defectInclude } from './constants/defect.constants';

@Injectable()
export class DefectService {
  constructor(private prisma: PrismaService) {}

  // Создание дефекта
  async create(dto: CreateDefectDto, reporterId: string) {
    const { projectId, assigneeId, ...rest } = dto;

    return this.prisma.defect.create({
      data: {
        ...rest,
        status: rest.status || DefectStatus.NEW,
        priority: rest.priority || DefectPriority.MEDIUM,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
        
        project: { connect: { id: projectId } },
        reporter: { connect: { id: reporterId } }, // Кто зафиксировал
        assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
      },
      include: defectInclude,
    });
  }

  // Получить один дефект
  async getById(id: string) {
    const defect = await this.prisma.defect.findUnique({
      where: { id },
      include: defectInclude,
    });

    if (!defect) throw new NotFoundException('Дефект не найден');
    return defect;
  }

  // Получить список с фильтрацией
  async getAllByProject(
    projectId: string,
    filters: {
      status?: DefectStatus;
      priority?: DefectPriority;
      assigneeId?: string;
      search?: string;
      dueDate?: string;
    }
  ) {
    const { status, priority, assigneeId, search, dueDate } = filters;

    const where: Prisma.DefectWhereInput = {
      projectId,
      status: status || undefined,
      priority: priority || undefined,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate ? { lte: new Date(dueDate) } : undefined, // Показываем все до этой даты
      OR: search
        ? [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    return this.prisma.defect.findMany({
      where,
      include: defectInclude,
      orderBy: {
        createdAt: 'desc', // Или position: 'asc', если добавишь поле position
      },
    });
  }

  // Обновление
  async update(id: string, dto: UpdateDefectDto) {
    const { assigneeId, dueDate, ...rest } = dto;

    // Проверяем существование
    await this.getById(id);

    return this.prisma.defect.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignee: assigneeId
          ? { connect: { id: assigneeId } }
          : assigneeId === null 
            ? { disconnect: true } // Если явно передали null - снимаем исполнителя
            : undefined,
      },
      include: defectInclude,
    });
  }

  // Kanban: Обновление статусов и порядка (Mass Update)
  // ВАЖНО: Требуется поле `position` в модели Defect (добавь в schema.prisma)
  async updateOrder(projectId: string, dto: UpdateDefectOrderDto) {
    const { defects } = dto;

    try {
      await this.prisma.$transaction(
        defects.map((defect) =>
          this.prisma.defect.update({
            where: {
              id: defect.id,
              // projectId добавляем в where для безопасности, чтобы не обновили чужой проект
              projectId: projectId, 
            },
            data: {
              status: defect.status,
              // position: defect.position, // Раскомментируй, если добавил поле в БД
            },
          })
        )
      );
    } catch (error) {
      // Логирование ошибки можно добавить здесь
      throw new Error('Не удалось обновить порядок задач');
    }
  }

  // Удаление
  async delete(id: string) {
    await this.getById(id); // Check exists
    return this.prisma.defect.delete({
      where: { id },
    });
  }
}