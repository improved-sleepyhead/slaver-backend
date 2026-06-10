import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { clearDatabase, createAndLoginUser } from './utils/test-utils';
import { ProjectRole } from '@prisma/client';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => app.close());
  beforeEach(async () => clearDatabase(prisma));

  it('should create a project and assign creator as MANAGER', async () => {
    const { accessToken } = await createAndLoginUser(app);

    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Building A', address: 'Moscow' })
      .expect(201);

    expect(res.body.name).toBe('Building A');
    
    // Проверяем роль в БД
    const member = await prisma.projectUser.findFirst({ where: { projectId: res.body.id } });
    expect(member.role).toBe(ProjectRole.MANAGER);
  });

  it('should forbid non-members from accessing project details', async () => {
    // User 1 создает проект
    const owner = await createAndLoginUser(app, 'owner@test.com');
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Secret Project' });
    const projectId = projectRes.body.id;

    // User 2 пытается получить доступ
    const stranger = await createAndLoginUser(app, 'stranger@test.com');
    
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .expect(403); // Forbidden
  });
});