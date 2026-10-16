import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { Post, PostSchema } from './schemas/post.schema.js';
import { PostExistsPipe } from './pipes/post-exists.pipe.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostExistsPipe],
  exports: [PostExistsPipe],
})
export class PostsModule {}
