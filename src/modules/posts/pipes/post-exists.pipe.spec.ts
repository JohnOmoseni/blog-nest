import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostExistsPipe } from './post-exists.pipe.js';
import { PostsService } from '../posts.service.js';

describe('PostExistsPipe', () => {
  let pipe: PostExistsPipe;
  const mockPostId = '507f1f77bcf86cd799439011';
  const missingPostId = '507f1f77bcf86cd799439012';

  const mockPostsService = {
    exists: (id: string) => Promise.resolve(id === mockPostId),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostExistsPipe,
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    pipe = module.get<PostExistsPipe>(PostExistsPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return id when post exists', async () => {
    await expect(pipe.transform(mockPostId)).resolves.toBe(mockPostId);
  });

  it('should throw NotFoundException when post does not exist', async () => {
    await expect(pipe.transform(missingPostId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException when id is invalid', async () => {
    await expect(pipe.transform('invalid')).rejects.toThrow(
      BadRequestException,
    );
  });
});

