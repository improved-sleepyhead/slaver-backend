import { Controller, Get, Body, Patch, Param, Delete, UseGuards, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/user.dto';
import { Auth } from 'src/common/decorators/auth.decorator'; // Путь к common
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { GlobalRole } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1. Получить профиль текущего юзера
  @Get('me')
  @Auth()
  async getMe(@CurrentUser('id') id: string) {
    return this.userService.getById(id);
  }

  // 2. Дашборд (статистика для главной страницы)
  @Get('dashboard')
  @Auth()
  async getDashboard(@CurrentUser('id') id: string) {
    return this.userService.getDashboard(id);
  }

  // 3. Админ получает любого юзера
  // @Auth(GlobalRole.ADMIN) 
  // Раскомментируй строку выше, когда будешь готов включить защиту
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.userService.getById(id);
  }

  // 4. Обновление профиля
  @Patch(':id')
  @Auth()
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    // Простейшая проверка: менять можно только себя или админу
    if (id !== user.id && user.role !== GlobalRole.ADMIN) {
        throw new Error('Forbidden'); // Лучше ForbiddenException
    }
    return this.userService.update(id, dto);
  }

  // 5. Удаление (только админ)
  @Delete(':id')
  @Auth(GlobalRole.ADMIN)
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}