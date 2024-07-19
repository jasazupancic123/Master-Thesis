export interface Page<T = any> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export function paginate<T = any>(
  items: T[],
  options: PaginationOptions
): Page<T> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const total = items.length;
  const data = items.slice((page - 1) * limit, page * limit);

  return { page, limit, total, data };
}