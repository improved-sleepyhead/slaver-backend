import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ProjectRole } from '@prisma/client';

// DTO для создания
export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  customer?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

// DTO для обновления
export class UpdateProjectDto extends CreateProjectDto {}

// DTO для добавления участника
export class AddMemberDto {
  @IsString()
  userId: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}

// DTO Статистики (упрощенное)
export class ProjectStatsDto {
  totalDefects: number;
  activeDefects: number; // В работе + На проверке
  closedDefects: number;
  overdueDefects: number;
}

export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole, { message: 'Недопустимая роль' })
  role: ProjectRole;
}