import { IsOptional, IsString, MinLength } from 'class-validator';

export class CommentAuthorDto {
  id: string;
  name: string;
  email: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Комментарий не может быть пустым' })
  content: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Комментарий не может быть пустым' })
  @IsOptional()
  content?: string;
}

export class CommentDto {
  id: string;
  content: string;
  author: CommentAuthorDto;
  defectId: string;
  createdAt: Date;
}