import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [], // Оставьте пустым! Не добавляйте сюда AuthModule
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService], // Экспортируем сервис, чтобы AuthModule мог его использовать
})
export class UserModule {}