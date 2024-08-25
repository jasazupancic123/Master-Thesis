import { IdsDto } from '../dto/id.dto';
import { PaginateOptions } from './paginate.type';

export interface Options<T> {
  filter?: Filter<T>;
  paginate?: PaginateOptions<T>;
  populate?: (keyof T)[];
}

/**
 * Filters any object by its fields and also by ids
 */
export type Filter<T = {}> = IdsDto & {
  [K in keyof T]?: T[K];
}
