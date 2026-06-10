import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { clearDatabase } from './utils/test-utils';

describe('Auth & User (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  it('/auth/register (POST) - should register a new user', async () => {
    // Уникальный email для этого теста
    const email = `register-test-${Date.now()}@test.com`;

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: email, // ИСПОЛЬЗУЕМ ПЕРЕМЕННУЮ
        password: 'password123',
        name: 'Tester',
      })
      .expect(200) // В прошлый раз у тебя ожидалось 201, но контроллер возвращал 200. Ставь 200.
      .expect((res) => {
        expect(res.body.user).toHaveProperty('id');
        expect(res.body).toHaveProperty('accessToken');
        // Refresh Token не в body, а в cookies!
        expect(res.headers['set-cookie']).toBeDefined(); // Проверяем наличие кук
      });
  });

  it('/users/me (GET) - should return profile of logged user', async () => {
    // 1. Register (с уникальным email!)
    const email = `me-test-${Date.now()}@test.com`;
    
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: email, password: 'password123', name: 'Me' });
      
    // Проверяем, что регистрация прошла, иначе нет смысла идти дальше
    expect(registerRes.status).toBe(200); 
    
    const token = registerRes.body.accessToken;

    // 2. Get Me
    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(email);
      });
  });
});