import { IsString, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { GlobalRole } from '@prisma/client'; // Импорт из Prisma!

export class UserDto {
  id: string;
  name: string;
  email: string;
  role: GlobalRole;
}

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Имя должно быть не менее 3 символов' })
  name: string;

  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
  password: string;

  @IsEnum(GlobalRole)
  @IsOptional()
  role?: GlobalRole;
}

export class UpdateUserDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsEnum(GlobalRole)
  @IsOptional()
  role?: GlobalRole;
}