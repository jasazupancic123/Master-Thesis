import { ClassConstructor, plainToInstance } from 'class-transformer';
import { PaginateOptions } from '../../type/paginate.type';

export class GenericUtil {
  serializeToDto<T, V extends Array<unknown>>(dtoClass: ClassConstructor<T>, plain: V): T[]
  serializeToDto<T, V>(dtoClass: ClassConstructor<T>, plain: V): T
  serializeToDto<T, V>(dtoClass: ClassConstructor<T>, plain: V | V[]): T | T[] {
    return plainToInstance(dtoClass, plain, { excludeExtraneousValues: true });
  }

  paginate<T>(data: T[], options: PaginateOptions<T> = {}): T[] {
    const { page, pageSize } = options;
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return data.slice(start, end);
  }
}