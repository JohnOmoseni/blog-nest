import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { PostsService } from '../posts.service.js';

@Injectable()
export class PostExistsPipe implements PipeTransform<string, Promise<string>> {
  constructor(private readonly postsService: PostsService) {}

  async transform(value: string, _metadata?: ArgumentMetadata): Promise<string> {
    if (!isValidObjectId(value)) {
      throw new BadRequestException(
        `Validation failed: "${value}" is not a valid MongoDB ObjectId`,
      );
    }

    const exists = await this.postsService.exists(value);
    if (!exists) {
      throw new NotFoundException(`Post with ID "${value}" not found`);
    }

    return value;
  }
}

