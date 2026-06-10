import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { AttachmentsService } from 'src/attachments/attachments.service';
import { clearDatabase, createAndLoginUser } from './utils/test-utils';
import { Buffer } from 'buffer';

describe('Attachments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let defectId: string;

  // Мок сервиса вложений
  const mockAttachmentsService = {
    uploadFile: jest.fn().mockImplementation((file, defectId, uploaderId) => {
      return Promise.resolve({
        id: 'test-att-id',
        url: 'http://mock-s3.com/file.jpg',
        filename: file.originalname,
        defectId,
        uploaderId
      });
    }),
    deleteFile: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AttachmentsService) // ПЕРЕОПРЕДЕЛЯЕМ СЕРВИС
      .useValue(mockAttachmentsService)
      .compile();

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

    // Создаем фиктивный дефект для привязки
    const project = await prisma.project.create({
      data: { name: 'P', ownerId: user.userId, members: { create: { userId: user.userId, role: 'MANAGER' } } }
    });
    const defect = await prisma.defect.create({
      data: { title: 'D', projectId: project.id, reporterId: user.userId }
    });
    defectId = defect.id;
  });

  it('should upload a file using mocked service', async () => {
    const fakeFile = Buffer.from('fake-image-content');

    await request(app.getHttpServer())
      .post('/attachments/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', fakeFile, 'test.jpg') // attach эмулирует multipart/form-data
      .field('defectId', defectId)
      .expect(201)
      .expect((res) => {
        expect(res.body.url).toBe('http://mock-s3.com/file.jpg');
      });
      
    expect(mockAttachmentsService.uploadFile).toHaveBeenCalled();
  });
});