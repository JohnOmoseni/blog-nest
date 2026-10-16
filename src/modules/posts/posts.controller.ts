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
import { PostDocument } from './schemas/post.schema.js';
import {
  CreatePostDto,
  GetPostsQueryDto,
  UpdatePostDto,
} from './dto/post.dto.js';
import { PostExistsPipe } from './pipes/post-exists.pipe.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() query: GetPostsQueryDto): Promise<PostDocument[]> {
    return this.postsService.getAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', PostExistsPipe) id: string): Promise<PostDocument> {
    return this.postsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto): Promise<PostDocument> {
    return this.postsService.create(createPostDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', PostExistsPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    return this.postsService.update(id, updatePostDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async replace(
    @Param('id', PostExistsPipe) id: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    return this.postsService.update(id, createPostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', PostExistsPipe) id: string): Promise<{
    message: string;
    id: string;
  }> {
    return this.postsService.delete(id);
  }
}

