import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ProjectRolesGuard } from '../guards/project-roles.guard';

// Используем: @ProjectAuth(ProjectRole.MANAGER)
export function ProjectAuth(...roles: ProjectRole[]) {
  return applyDecorators(
    SetMetadata('project-roles', roles),
    UseGuards(JwtAuthGuard, ProjectRolesGuard),
  );
}