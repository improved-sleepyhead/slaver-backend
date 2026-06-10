import { 
  Controller, 
  Post, 
  Delete, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  Body, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator, 
  UseGuards,
  HttpCode
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file')) // 'file' - это имя поля в form-data
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Макс размер 5МБ (настраивается)
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), 
          // Разрешаем картинки и PDF
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }), 
        ],
      }),
    ) file: Express.Multer.File,
    @Body('defectId') defectId: string, // ID дефекта передаем в body
    @CurrentUser('id') userId: string,
  ) {
    return this.attachmentsService.uploadFile(file, defectId, userId);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(204)
  async deleteFile(@Param('id') id: string) {
    // В идеале добавить проверку: удалять может только автор или менеджер
    return this.attachmentsService.deleteFile(id);
  }
}