import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { PostExistsPipe } from './pipes/post-exists.pipe.js';
import { Post } from './schemas/post.schema.js';

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        PostsService,
        PostExistsPipe,
        {
          provide: getModelToken(Post.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

