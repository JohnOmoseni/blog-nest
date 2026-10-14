import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import type { Post as PostEntity } from './interfaces/post.interface.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAll(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('search') search?: string,
  ): PostEntity[] {
    return this.postsService.getAll({ limit, page, search });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): PostEntity {
    return this.postsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() payload: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): PostEntity {
    return this.postsService.create(payload);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() payload: Partial<Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): PostEntity {
    return this.postsService.update(id, payload);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  replace(
    @Param('id') id: string,
    @Body() payload: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): PostEntity {
    return this.postsService.update(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string): { message: string; id: string } {
    return this.postsService.delete(id);
  }
}
