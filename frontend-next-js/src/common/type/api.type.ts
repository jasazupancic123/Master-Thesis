import { PaginateOptions } from '@/common/type/paginate.type';

export type FetchOptions = {
  method?: string;
  token?: string;
  body?: object;
  query?: Record<string, string | number>;
  formData?: FormData;
}

export type FindOptions<T extends Record<string, unknown>> = {
  filter?: Filter<T>;
  paginate?: PaginateOptions<T>;
}

/**
 * Filterable fields of an object. It can be a string, number, date or boolean,
 * and cannot be an object or an array.
 */
type FilterableFields<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends string | Array<string> | number | Date | boolean ? K : null;
}[keyof T];

/**
 * Filters any object by its fields and also by ids
 */
export type Filter<T> = { ids?: string[] } & {
  // @ts-ignore
  [K in FilterableFields<T>]?: {
    value: any;
    op?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in';
  }
}
