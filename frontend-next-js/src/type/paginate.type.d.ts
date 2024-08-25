export interface PaginateOptions<T> {
  order?: OrderBy<T>;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export type OrderBy<T> = {
  [K in keyof T]?: 'asc' | 'desc';
}