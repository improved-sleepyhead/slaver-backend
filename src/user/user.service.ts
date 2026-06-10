import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Путь может отличаться
import { hash } from 'argon2';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserDashboardDto } from './dto/user-profile.dto';
import { DefectStatus } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        projectsOwned: { select: { id: true, name: true } },
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Получаем статистику одним эффективным запросом
  async getDashboard(userId: string): Promise<UserDashboardDto> {
    const now = new Date();

    // 1. Считаем дефекты по статусам (GROUP BY)
    // Это делает один запрос в БД вместо кучи count
    const statusCounts = await this.prisma.defect.groupBy({
      by: ['status'],
      where: { assigneeId: userId },
      _count: {
        id: true,
      },
    });

    // 2. Считаем просроченные (отдельный запрос, так как условие сложное)
    const overdueCount = await this.prisma.defect.count({
      where: {
        assigneeId: userId,
        status: { notIn: [DefectStatus.CLOSED, DefectStatus.CANCELED] }, // Не закрытые
        dueDate: { lt: now }, // Дата прошла
      },
    });

    // 3. Считаем проекты
    const projectsCount = await this.prisma.projectUser.count({
      where: { userId },
    });

    // Агрегируем результаты из group by
    let totalDefects = 0;
    let closedDefects = 0;
    let activeDefects = 0;

    statusCounts.forEach((item) => {
      const count = item._count.id;
      totalDefects += count;

      if (item.status === DefectStatus.CLOSED || item.status === DefectStatus.CANCELED) {
        closedDefects += count;
      } else {
        activeDefects += count;
      }
    });

    return {
      totalDefects,
      activeDefects,
      closedDefects,
      overdueDefects: overdueCount,
      projectsCount,
    };
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await hash(dto.password);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = { ...dto };

    if (dto.password) {
      data.password = await hash(dto.password);
    }

    // Проверяем существование
    await this.getById(id);

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.getById(id); // Проверка
    return this.prisma.user.delete({
      where: { id },
    });
  }
}