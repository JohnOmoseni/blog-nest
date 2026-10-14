import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { PostExistsPipe } from './pipes/post-exists.pipe.js';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PostExistsPipe],
  exports: [PostExistsPipe],
})
export class PostsModule {}
