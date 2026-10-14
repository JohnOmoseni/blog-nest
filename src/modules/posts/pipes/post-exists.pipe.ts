import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { PostsService } from '../posts.service.js';

@Injectable()
export class PostExistsPipe implements PipeTransform<number | string, number> {
  constructor(private readonly postsService: PostsService) {}

  transform(value: number | string, _metadata: ArgumentMetadata): number {
    const id = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException(
        `Validation failed: "${value}" is not a valid post ID (positive integer expected)`,
      );
    }
    try {
      this.postsService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Post with ID "${id}" not found`);
      }
    }

    // if (!this.postsService.exists(id)) {
    //   throw new NotFoundException(`Post with ID "${id}" not found`);
    // }

    return id;
  }
}
