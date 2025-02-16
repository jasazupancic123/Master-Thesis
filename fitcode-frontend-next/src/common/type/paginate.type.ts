export type PaginateOptions<T> = {
  orderBy?: { field: keyof T; value: 'asc' | 'desc' };
  page?: number;
  pageSize?: number;
};

export type Pagination = {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
};
