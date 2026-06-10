import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma.service';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<ProjectRole[]>('project-roles', context.getHandler());
    
    // Если роли не указаны — пускаем (или проверяем только членство)
    // В нашей логике, если @ProjectAuth висит, проверка членства обязательна
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // ИЩЕМ ID ПРОЕКТА: может быть 'id' или 'projectId'
    const projectId = request.params.id || request.params.projectId;

    if (!user || !projectId) {
      // Если ID проекта не найден в URL, гвард не может работать корректно
      return false;
    }

    const member = await this.prisma.projectUser.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: projectId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Вы не являетесь участником этого проекта');
    }

    if (roles && roles.length > 0 && !roles.includes(member.role)) {
      throw new ForbiddenException(`Недостаточно прав. Требуется: ${roles.join(', ')}`);
    }

    return true;
  }
}