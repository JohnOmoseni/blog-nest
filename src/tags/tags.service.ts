import { Injectable } from '@nestjs/common';

@Injectable()
export class TagsService {
  getAll() {
    return 'all tags';
  }

  findOne(id: string) {
    return `tag ${id}`;
  }

  create(payload: any) {
    return payload;
  }

  update(id: string, payload: any) {
    return `${payload} ${id}`;
  }

  delete(id: string) {
    return `tag ${id}`;
  }
}
