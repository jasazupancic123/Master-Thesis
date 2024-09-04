import { IdsDto } from '../dto/id.dto';
import { PaginateOptions } from './paginate.type';
import { WhereFilterOp } from 'firebase-admin/lib/firestore';

export interface Options<T extends object> {
  filter?: Filter<T>;
  paginate?: PaginateOptions<T>;
  populate?: (keyof T)[];
}

export interface FindOneOptions<T extends object> {
  populate?: NestedKeyOf<T>[];
}

type NestedKeyOf<ObjectType extends object> =
  {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
  }[keyof ObjectType & (string | number)];

export interface Condition<T> {
  field: keyof T;
  value: any;
  operator?: WhereFilterOp;
}

export type FilterOperatorKeys = keyof FilterOperator<any>;

export interface FilterOperator<T> {
  $lt?: T;
  $lte?: T;
  $gt?: T;
  $gte?: T;
  $ne?: T;
  $in?: T[];
  $arrayContains?: T;
  $notIn?: T[];
  $arrayContainsAny?: T[];
}

export function isFilterOperator<T>(value: any): value is FilterOperator<T> {
  return typeof value === 'object' && value !== null;
}

/**
 * Filters any object by its fields and also by ids
 */
export type Filter<T = {}> = IdsDto & {
  [K in keyof T]?: T[K] | FilterOperator<T[K]>;
}
