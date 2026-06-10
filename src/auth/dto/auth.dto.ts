import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { GlobalRole } from "@prisma/client";

export class AuthDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @MinLength(8, {
        message: 'Password must be at least 8 characters long'
    })
    @IsString()
    password: string;

    // Опционально: роль при регистрации (для старта разработки полезно)
    // В проде обычно роль выдает админ отдельно
    @IsOptional()
    @IsEnum(GlobalRole)
    role?: GlobalRole;
}