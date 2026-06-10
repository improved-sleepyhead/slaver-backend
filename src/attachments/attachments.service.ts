import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class AttachmentsService {
  private s3: S3;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');

    // Инициализация клиента S3 по вашему примеру
    this.s3 = new S3({
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      },
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION'),
      s3ForcePathStyle: true, // Важно для S3-совместимых хранилищ типа Selectel
      apiVersion: 'latest',
    });
  }

  // Загрузка файла
  async uploadFile(file: Express.Multer.File, defectId: string, uploaderId: string) {
    // 1. Проверяем, существует ли дефект
    const defect = await this.prisma.defect.findUnique({ where: { id: defectId } });
    if (!defect) throw new NotFoundException('Дефект не найден');

    // 2. Генерируем уникальное имя файла
    // Например: defects/defect-id/uuid.jpg
    const fileExtension = extname(file.originalname);
    const key = `defects/${defectId}/${uuidv4()}${fileExtension}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Раскомментировать, если бакет публичный
    };

    try {
      // 3. Загружаем в S3
      const uploadResult = await this.s3.upload(params).promise();

      // 4. Сохраняем метаданные в БД
      const attachment = await this.prisma.attachment.create({
        data: {
          filename: file.originalname, // Оригинальное имя для пользователя
          url: uploadResult.Location,  // Ссылка на файл
          mimeType: file.mimetype,
          key: key, // Сохраняем ключ, чтобы потом можно было удалить файл из S3
          defect: { connect: { id: defectId } },
          uploader: { connect: { id: uploaderId } },
        },
      });

      return attachment;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new InternalServerErrorException('Ошибка при загрузке файла в хранилище');
    }
  }

  // Удаление файла
  async deleteFile(attachmentId: string) {
    // 1. Ищем файл в БД
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) throw new NotFoundException('Файл не найден');

    try {
      // 2. Удаляем из S3, используя сохраненный ключ
      if (attachment.key) {
        await this.s3.deleteObject({
            Bucket: this.bucketName,
            Key: attachment.key
        }).promise();
      }

      // 3. Удаляем запись из БД
      await this.prisma.attachment.delete({
        where: { id: attachmentId },
      });

      return { success: true };
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new InternalServerErrorException('Ошибка при удалении файла');
    }
  }
}