import { Injectable, NotFoundException } from '@nestjs/common';
import type { Post } from './interfaces/post.interface.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import type { UpdatePostDto } from './dto/update-post.dto.js';
import type { GetPostsQueryDto } from './dto/get-posts-query.dto.js';

@Injectable()
export class PostsService {
  private posts: Post[] = [
    {
      id: 1,
      title: 'Getting Started with NestJS',
      content:
        'NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.',
      authorName: 'John Doe',
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      updatedAt: new Date('2026-01-10T09:00:00.000Z'),
    },
    {
      id: 2,
      title: 'Mastering TypeScript in 2026',
      content:
        'TypeScript provides static typing and modern JavaScript features to build robust applications.',
      authorName: 'Jane Smith',
      createdAt: new Date('2026-01-15T14:30:00.000Z'),
      updatedAt: new Date('2026-01-15T14:30:00.000Z'),
    },
  ];

  private getNextId() {
    return this.posts.length > 0
      ? Math.max(...this.posts.map((p) => Number(p.id) || 0)) + 1
      : 1;
  }

  getAll(query?: GetPostsQueryDto): Post[] {
    let result = [...this.posts];

    if (query?.search) {
      const term = query.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.content.toLowerCase().includes(term),
      );
    }

    if (query?.page && query?.limit) {
      const page = Number(query.page);
      const limit = Number(query.limit);
      const start = (page - 1) * limit;
      result = result.slice(start, start + limit);
    } else if (query?.limit) {
      result = result.slice(0, Number(query.limit));
    }

    return result;
  }

  findOne(id: number): Post {
    const post = this.posts.find((item) => item.id === id);
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  create(payload: CreatePostDto): Post {
    const newPost: Post = {
      id: this.getNextId(),
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.push(newPost);
    return newPost;
  }

  update(id: number, payload: UpdatePostDto): Post {
    const index = this.posts.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    const updatedPost: Post = {
      ...this.posts[index],
      ...payload,
      updatedAt: new Date(),
    };
    this.posts[index] = updatedPost;
    return updatedPost;
  }

  delete(id: number): { message: string; id: number } {
    const index = this.posts.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    this.posts.splice(index, 1);
    return {
      message: `Post with ID "${id}" deleted successfully`,
      id,
    };
  }
}
