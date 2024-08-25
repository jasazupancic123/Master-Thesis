import { OrderByDirection } from 'firebase-admin/firestore';

export interface PaginateOptions<T> {
  order?: OrderBy<T>;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export type OrderBy<T> = {
  [K in keyof T]?: OrderByDirection;
}