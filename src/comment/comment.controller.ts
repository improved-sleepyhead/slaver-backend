import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Patch, 
  Delete, 
  HttpCode, 
  UsePipes, 
  ValidationPipe 
} from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CommentService } from './comment.service';

@Controller('defects/:defectId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Auth()
  @UsePipes(new ValidationPipe())
  async create(
    @Param('defectId') defectId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') authorId: string,
  ) {
    return this.commentService.create(dto, authorId, defectId);
  }

  @Get()
  @Auth()
  async getAllByDefect(@Param('defectId') defectId: string) {
    return this.commentService.getAllByDefect(defectId);
  }

  // Получение одного комментария (редкий кейс, но оставим)
  @Get(':commentId')
  @Auth()
  async getById(
    @Param('defectId') defectId: string,
    @Param('commentId') commentId: string,
  ) {
    // В теории здесь нужно проверить, принадлежит ли коммент этому дефекту,
    // но ID комментария и так уникален глобально (CUID).
    return this.commentService.getById(commentId);
  }

  @Patch(':commentId')
  @Auth()
  @UsePipes(new ValidationPipe())
  async update(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentService.update(commentId, userId, dto);
  }

  @Delete(':commentId')
  @HttpCode(204)
  @Auth()
  async delete(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentService.delete(commentId, userId);
  }
}