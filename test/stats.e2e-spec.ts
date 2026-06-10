import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { clearDatabase, createAndLoginUser } from './utils/test-utils';
import { DefectStatus } from '@prisma/client';

describe('Statistics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let projectId: string; // <--- 1. Объявляем переменную здесь

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => app.close());

  beforeEach(async () => {
    await clearDatabase(prisma);
    const user = await createAndLoginUser(app);
    authToken = user.accessToken;
    
    // Подготовка данных
    const project = await prisma.project.create({
      data: { name: 'Stats Proj', ownerId: user.userId, members: { create: { userId: user.userId, role: 'MANAGER' } } }
    });

    // Создаем 2 дефекта: 1 закрыт, 1 открыт
    await prisma.defect.create({
      data: { title: 'D1', projectId: project.id, reporterId: user.userId, status: DefectStatus.CLOSED, assigneeId: user.userId }
    });
    await prisma.defect.create({
      data: { title: 'D2', projectId: project.id, reporterId: user.userId, status: DefectStatus.NEW, assigneeId: user.userId }
    });

    // ОБНОВЛЯЕМ MV вручную
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW "project_stats_mv"`);
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW "user_project_stats_mv"`);
    
    projectId = project.id; // <--- 2. Присваиваем значение переменной (без this)
  });

  it('should return project stats', async () => {
    const res = await request(app.getHttpServer())
      .get(`/projects/${projectId}/statistics/general`) // <--- 3. Используем переменную
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // console.log(res.body); // Раскомментируй для отладки, если тесты падают

    expect(res.body.total_defects).toBe(2);
    expect(res.body.closed_defects).toBe(1);
    expect(res.body.progress_percentage).toBe(50);
  });
});