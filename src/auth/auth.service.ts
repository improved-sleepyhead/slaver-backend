import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service'; // Проверь, возможно путь '../users/user.service'
import { AuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto'; // <--- Импорт
import { verify } from 'argon2';
import { Response } from 'express';

@Injectable()
export class AuthService {
    // Конфигурация токенов
    EXPIRE_DAY_REFRESH_TOKEN = 7;
    REFRESH_TOKEN_NAME = 'refreshToken';

    constructor(
        private jwt: JwtService,
        private userService: UserService
    ) {}

    // Принимаем LoginDto
    async login(dto: LoginDto) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...user } = await this.validateUser(dto);
        const tokens = this.issueTokens(user.id);

        return {
            user,
            ...tokens,
        };
    }

    // При регистрации используем AuthDto (где есть name)
    async register(dto: AuthDto) {
        const oldUser = await this.userService.getByEmail(dto.email);
        if (oldUser) throw new BadRequestException('Пользователь с таким email уже существует');

        // Создаем пользователя. Пароль хешируется внутри userService.create
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...user } = await this.userService.create({
            email: dto.email,
            name: dto.name,
            password: dto.password,
            // role: dto.role // Раскомментируй, если в AuthDto есть поле role
        });

        const tokens = this.issueTokens(user.id);

        return {
            user,
            ...tokens,
        };
    }

    async getNewTokens(refreshToken: string) {
        try {
            const result = await this.jwt.verifyAsync(refreshToken);
            if (!result || !result.id) {
                throw new UnauthorizedException('Invalid refresh token');
            }
        
            const user = await this.userService.getById(result.id);
            if (!user) {
                throw new NotFoundException('User not found');
            }
        
            const tokens = this.issueTokens(user.id);
        
            return {
                user,
                ...tokens,
            };
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token signature');
        }
    }

    private issueTokens(userId: string) {
        const data = { id: userId };
        
        const accessToken = this.jwt.sign(data, {
            expiresIn: '1h'
        });

        const refreshToken = this.jwt.sign(data, {
            expiresIn: '7d'
        });

        return { accessToken, refreshToken };
    }

    // Валидация тоже работает с LoginDto
    private async validateUser(dto: LoginDto) {
        const user = await this.userService.getByEmail(dto.email);

        if (!user) throw new NotFoundException('User not found');

        const isValid = await verify(user.password, dto.password);

        if (!isValid) throw new UnauthorizedException('Invalid password');

        return user;
    }

    addRefreshTokenToResponse(res: Response, refreshToken: string) {
        const expiresIn = new Date();
        expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);
        
        res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
            httpOnly: true,
            domain: 'localhost', // В продакшене брать из env
            expires: expiresIn,
            secure: true,
            sameSite: 'none'
        });
    }

    removeRefreshTokenFromResponse(res: Response) {
        res.cookie(this.REFRESH_TOKEN_NAME, '', {
            httpOnly: true,
            domain: 'localhost',
            expires: new Date(0),
            secure: true,
            sameSite: 'none'
        });
    }
}