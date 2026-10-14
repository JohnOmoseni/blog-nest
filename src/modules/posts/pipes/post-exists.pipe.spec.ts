import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostExistsPipe } from './post-exists.pipe.js';
import { PostsService } from '../posts.service.js';

describe('PostExistsPipe', () => {
  let pipe: PostExistsPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostExistsPipe, PostsService],
    }).compile();

    pipe = module.get<PostExistsPipe>(PostExistsPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return id when post exists', () => {
    expect(pipe.transform(1, { type: 'param' })).toBe(1);
  });

  it('should throw NotFoundException when post does not exist', () => {
    expect(() => pipe.transform(999, { type: 'param' })).toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException when id is invalid', () => {
    expect(() => pipe.transform('invalid', { type: 'param' })).toThrow(
      BadRequestException,
    );
  });
});
