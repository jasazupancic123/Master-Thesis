import { OrderByDirection, WhereFilterOp } from 'firebase-admin/lib/firestore';

export interface PaginateOptions<T> {
  orderBy?: { field: keyof T; value: OrderByDirection };
  page?: number;
  pageSize?: number;
}

export interface FindManyOptions<T extends Record<string, any>> {
  filter?: Filter<T>;
  paginate?: PaginateOptions<T>;
  populate?: NestedKey<T>[];
}

export interface FindOneOptions<T extends Record<string, any>> {
  populate?: NestedKey<T>[];
}

/**
 * NestedKey is a type that represents the nested keys of an object. It is used
 * to populate nested objects in the database. For example, if we have a user
 * object with a nested address object, we can populate the address object by
 * passing the key 'address' to the populate option. If the address object has
 * a nested city object, we can populate the city object by passing the key
 * 'address.city' to the populate option.
 *
 * @example
 * ```ts
 * type User = {
 *  name: string;
 *  address: {
 *    street: string;
 *    city: {
 *      name: string;
 *    }
 *  }
 * }
 *
 * constant populate: NestedKey<User>[] = ['address', 'address.city']; // type safe
 * ```
 */
type NestedKey<O extends Record<string, any>> = {
  [K in Extract<keyof O, string>]:
  O[K] extends Array<string>
    ? K
    : O[K] extends string | number | Date | boolean | Array<string> | Array<number> | Array<Date> | Array<boolean> | Function
      ? never
      : O[K] extends Array<any>
        ? K | `${K}.${NestedKey<O[K][0]> extends infer U extends string ? U : never}`
        : O[K] extends Record<string, unknown>
          ? `${K}` | `${K}.${NestedKey<O[K]> extends infer U extends string ? U : never}`
          : K
}[Extract<keyof O, string>];

export interface Condition<T> {
  field: keyof T;
  value: any;
  operator?: WhereFilterOp;
}

/**
 * Filterable fields of an object. It can be a string, number, date or boolean,
 * and cannot be an object or an array.
 */
type FilterableFields<T> = {
  [K in keyof T]: T[K] extends string | number | Date | boolean ? K : null;
}[keyof T];

/**
 * Filters any object by its fields and also by ids
 */
export type Filter<T = {}> = { ids?: string[] } & {
  [K in FilterableFields<T>]?: {
    value: any;
    op?: WhereFilterOp;
  }
}
