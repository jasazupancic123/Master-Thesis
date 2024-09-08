export interface PaginateOptions<T> {
  orderBy?: { field: keyof T; value: 'asc' | 'desc' };
  page?: number;
  pageSize?: number;
}
