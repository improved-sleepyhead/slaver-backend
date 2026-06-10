import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { commentSelect } from './constants/comment.constants';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommentDto, authorId: string, defectId: string) {
    // Проверка существования дефекта (опционально, prisma и так выкинет ошибку FK)
    const defect = await this.prisma.defect.findUnique({ where: { id: defectId } });
    if (!defect) throw new NotFoundException('Дефект не найден');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        author: { connect: { id: authorId } },
        defect: { connect: { id: defectId } },
      },
      select: commentSelect,
    });
  }

  async getById(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: commentSelect,
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    return comment;
  }

  async getAllByDefect(defectId: string) {
    return this.prisma.comment.findMany({
      where: { defectId },
      orderBy: { createdAt: 'asc' }, // Комментарии обычно читают сверху вниз
      select: commentSelect,
    });
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.getById(id);

    // Проверка прав: редактировать может только автор
    if (comment.authorId !== userId) {
        throw new ForbiddenException('Вы не можете редактировать чужой комментарий');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
      },
      select: commentSelect,
    });
  }

  async delete(id: string, userId: string) {
    const comment = await this.getById(id);

    // Проверка прав: удалять может автор (можно расширить логику для Менеджера)
    if (comment.authorId !== userId) {
        throw new ForbiddenException('Вы не можете удалить чужой комментарий');
    }

    await this.prisma.comment.delete({
      where: { id },
    });
  }
}