import { INestApplication } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as request from 'supertest';

export async function clearDatabase(prisma: PrismaService) {
  const tablenames = [
    'Attachment',
    'Comment',
    'Defect',
    'ProjectUser',
    'Project',
    'User',
  ];

  try {
    for (const table of tablenames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }
  } catch (error) {
    console.error(`ERROR cleaning table ${tablenames}:`, error);
  }
}

export async function createAndLoginUser(app: INestApplication, email?: string, role = 'USER') {
  const uniqueEmail = email || `test-${Date.now()}-${Math.random()}@example.com`;

  // 1. Регистрация
  const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
    email: uniqueEmail,
    password: 'password123',
    name: 'Test User',
    role
  });

  if (registerRes.status !== 200 && registerRes.status !== 201) {
    console.error('Registration failed:', registerRes.body);
    throw new Error('Registration failed');
  }

  // 2. Логин (чтобы точно получить свежий токен, хотя register его тоже возвращает)
  const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
    email: uniqueEmail,
    password: 'password123',
  });

  if (!loginRes.body.accessToken) {
    console.error('Login failed (no token):', loginRes.body);
    throw new Error('Login failed');
  }

  return {
    accessToken: loginRes.body.accessToken,
    userId: loginRes.body.user.id, // Убедись, что AuthController возвращает user
    cookies: loginRes.headers['set-cookie'],
  };
}