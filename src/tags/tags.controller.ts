import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TagsService } from './tags.service.js';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagService: TagsService) {}

  @Get()
  getAll() {
    return this.tagService.getAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagService.findOne(id);
  }
  @Post()
  create(@Body() payload: any) {
    return this.tagService.create(payload);
  }
  @Patch(':id')
  update(@Body() payload: any, @Param('id') id: string) {
    return this.tagService.update(id, payload);
  }
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tagService.delete(id);
  }
}
