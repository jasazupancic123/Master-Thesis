import { PaginateOptions } from '@/common/type/paginate.type';

export class GenericUtil {
  sleep(s: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  }

  paginate<T>(data: T[], options: PaginateOptions<T> = {}): T[] {
    const { page = 1, pageSize = 10 } = options;
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return data.slice(start, end);
  }
}