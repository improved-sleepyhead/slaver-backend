import { Module } from '@nestjs/common';
import { DefectService } from './defect.service';
import { DefectController } from './defect.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [DefectController],
  providers: [DefectService, PrismaService],
})
export class DefectModule {}
