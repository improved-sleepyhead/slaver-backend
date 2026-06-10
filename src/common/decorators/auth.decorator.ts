import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../guards/jwt.guard";
import { RolesGuard } from "../guards/roles.guard";


export const ROLES_KEY = 'roles';

// Декоратор, который принимает список разрешенных ролей
// Пример использования: @Auth(GlobalRole.ADMIN, GlobalRole.MANAGER)
export const Auth = (...roles: GlobalRole[]) => {
    return applyDecorators(
        SetMetadata(ROLES_KEY, roles),
        UseGuards(JwtAuthGuard, RolesGuard)
    );
};