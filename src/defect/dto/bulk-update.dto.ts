import { IsString, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { DefectStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateDefectOrderItemDto {
  @IsString()
  id: string;

  @IsEnum(DefectStatus)
  status: DefectStatus;

  @IsNumber()
  position: number;
}

export class UpdateDefectOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDefectOrderItemDto)
  defects: UpdateDefectOrderItemDto[];
}