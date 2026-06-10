import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class GenerateInviteDto {
  @IsEnum(ProjectRole)
  role: ProjectRole; // Какую роль получит человек, перешедший по ссылке (обычно ENGINEER или OBSERVER)
}

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}