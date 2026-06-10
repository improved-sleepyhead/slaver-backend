import { IsString, IsOptional, IsEnum, MinLength, IsDateString } from 'class-validator';
import { DefectStatus, DefectPriority } from '@prisma/client';

export class CreateDefectDto {
  @IsString()
  @MinLength(3, { message: 'Заголовок должен быть не менее 3 символов' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string; // Важно для стройки (напр. "Ось А-4, 2 этаж")

  @IsEnum(DefectStatus)
  @IsOptional()
  status?: DefectStatus;

  @IsEnum(DefectPriority)
  @IsOptional()
  priority?: DefectPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  projectId: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}

export class UpdateDefectDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(DefectStatus)
  @IsOptional()
  status?: DefectStatus;

  @IsEnum(DefectPriority)
  @IsOptional()
  priority?: DefectPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}