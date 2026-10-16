import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema.js';
import type {
  CreatePostDto,
  UpdatePostDto,
  GetPostsQueryDto,
} from './dto/post.dto.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async getAll(query?: GetPostsQueryDto): Promise<PostDocument[]> {
    const filter: Record<string, any> = {};

    if (query?.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
      ];
    }

    const limit = query?.limit ? Number(query.limit) : 10;
    const page = query?.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    return this.postModel.find(filter).skip(skip).limit(limit).exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  async exists(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }
    const count = await this.postModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  async create(payload: CreatePostDto): Promise<PostDocument> {
    const newPost = new this.postModel(payload);
    return newPost.save();
  }

  async update(id: string, payload: UpdatePostDto): Promise<PostDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();

    if (!updatedPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return updatedPost;
  }

  async delete(id: string): Promise<{ message: string; id: string }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    const deletedPost = await this.postModel.findByIdAndDelete(id).exec();
    if (!deletedPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return {
      message: `Post with ID "${id}" deleted successfully`,
      id,
    };
  }
}

