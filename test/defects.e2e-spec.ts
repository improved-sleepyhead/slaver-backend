import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { clearDatabase, createAndLoginUser } from './utils/test-utils';
import { DefectStatus } from '@prisma/client';

describe('Defects & Comments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let projectId: string;
  let userId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => app.close());

  beforeEach(async () => {
    await clearDatabase(prisma);
    const user = await createAndLoginUser(app);
    authToken = user.accessToken;
    userId = user.userId;

    // Создаем проект заранее
    const pRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project' });
    projectId = pRes.body.id;
  });

  it('should create a defect', async () => {
    const res = await request(app.getHttpServer())
      .post('/defects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Broken Wall',
        projectId: projectId,
        status: DefectStatus.NEW
      })
      .expect(201);

    expect(res.body.title).toBe('Broken Wall');
    expect(res.body.projectId).toBe(projectId);
  });

  it('should add comment to defect', async () => {
    // 1. Создаем дефект
    const defect = await prisma.defect.create({
      data: {
        title: 'Test',
        projectId,
        reporterId: userId,
        status: DefectStatus.NEW
      }
    });

    // 2. Добавляем коммент
    await request(app.getHttpServer())
      .post(`/defects/${defect.id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Fixed it' })
      .expect(201);

    // 3. Проверяем список
    const res = await request(app.getHttpServer())
      .get(`/defects/${defect.id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe('Fixed it');
  });
});