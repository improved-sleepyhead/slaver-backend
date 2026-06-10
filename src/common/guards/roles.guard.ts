import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GlobalRole, User } from "@prisma/client";
import { ROLES_KEY } from "../decorators/auth.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<GlobalRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest<{ user: User }>();

        if (!user) {
            throw new ForbiddenException('User not recognized');
        }

        // Если у пользователя роль ADMIN, пускаем везде (опционально)
        if (user.role === GlobalRole.ADMIN) return true;

        const hasRole = requiredRoles.includes(user.role);
        
        if (!hasRole) {
            throw new ForbiddenException('У вас нет прав для выполнения этой операции');
        }

        return true;
    }
}