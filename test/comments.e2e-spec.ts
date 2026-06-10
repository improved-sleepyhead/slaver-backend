import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { clearDatabase, createAndLoginUser } from './utils/test-utils';
import { DefectStatus } from '@prisma/client';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Данные для тестов
  let user1Token: string;
  let user1Id: string;
  let user2Token: string; // "Чужой" пользователь (злоумышленник)
  let defectId: string;

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

    // 1. Создаем двух пользователей
    const user1 = await createAndLoginUser(app, 'author@test.com');
    user1Token = user1.accessToken;
    user1Id = user1.userId;

    const user2 = await createAndLoginUser(app, 'hacker@test.com');
    user2Token = user2.accessToken;

    // 2. Создаем проект и дефект (от лица user1)
    const project = await prisma.project.create({
      data: {
        name: 'Comment Test Project',
        ownerId: user1Id,
        members: { create: { userId: user1Id, role: 'MANAGER' } }
      }
    });

    const defect = await prisma.defect.create({
      data: {
        title: 'Defect for comments',
        projectId: project.id,
        reporterId: user1Id,
        status: DefectStatus.NEW
      }
    });
    defectId = defect.id;
  });

  // --- ТЕСТЫ ---

  it('/defects/:id/comments (POST) - should create a comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/defects/${defectId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Fix logic please' })
      .expect(201);

    expect(res.body.content).toBe('Fix logic please');
    expect(res.body.author.id).toBe(user1Id);
    expect(res.body.defectId).toBe(defectId);
  });

  it('/defects/:id/comments (GET) - should return list of comments', async () => {
    // Сначала создадим 2 комментария
    await prisma.comment.create({ data: { content: 'First', authorId: user1Id, defectId } });
    await prisma.comment.create({ data: { content: 'Second', authorId: user1Id, defectId } });

    const res = await request(app.getHttpServer())
      .get(`/defects/${defectId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body[0].content).toBe('First');
    expect(res.body[1].content).toBe('Second');
  });

  it('(PATCH) - author should be able to update their own comment', async () => {
    // Создаем комментарий
    const comment = await prisma.comment.create({
      data: { content: 'Old Text', authorId: user1Id, defectId }
    });

    // Обновляем
    const res = await request(app.getHttpServer())
      .patch(`/defects/${defectId}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'New Text' })
      .expect(200);

    expect(res.body.content).toBe('New Text');

    // Проверяем в БД
    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } });
    expect(dbComment.content).toBe('New Text');
  });

  it('(PATCH) - another user CANNOT update someone else\'s comment', async () => {
    // Комментарий создал User 1
    const comment = await prisma.comment.create({
      data: { content: 'User1 Text', authorId: user1Id, defectId }
    });

    // User 2 пытается обновить
    await request(app.getHttpServer())
      .patch(`/defects/${defectId}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${user2Token}`) // <-- Токен второго юзера
      .send({ content: 'Hacked Text' })
      .expect(403); // ForbiddenException

    // Убеждаемся, что текст не поменялся
    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } });
    expect(dbComment.content).toBe('User1 Text');
  });

  it('(DELETE) - author should be able to delete their own comment', async () => {
    const comment = await prisma.comment.create({
      data: { content: 'To delete', authorId: user1Id, defectId }
    });

    await request(app.getHttpServer())
      .delete(`/defects/${defectId}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(204);

    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } });
    expect(dbComment).toBeNull();
  });

  it('(DELETE) - another user CANNOT delete someone else\'s comment', async () => {
    const comment = await prisma.comment.create({
      data: { content: 'User1 Comment', authorId: user1Id, defectId }
    });

    // User 2 пытается удалить
    await request(app.getHttpServer())
      .delete(`/defects/${defectId}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(403); // Forbidden

    // Комментарий все еще в базе
    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } });
    expect(dbComment).not.toBeNull();
  });
});