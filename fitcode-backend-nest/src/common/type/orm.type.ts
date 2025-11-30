import type { DocumentData, DocumentReference } from '@google-cloud/firestore';
import type { WhereFilterOp } from 'firebase-admin/lib/firestore';

import type { FirestoreEntity } from './entity.type';

export interface Condition<T> {
  field: keyof T;
  value: unknown;
  operator?: WhereFilterOp;
}

/**
 * Filterable fields of an object. It can be a string, number, date or boolean,
 * and cannot be an object or an array.
 */
type FilterableFields<T, V> = {
  [K in keyof T]: T[K] extends string | Array<V> | number | Date | boolean
    ? K
    : null;
}[keyof T];

/**
 * Filters any object by its fields and also by ids
 */
export type Filter<T, V = unknown> = { ids?: string[] } & {
  [K in FilterableFields<T, V>]?: T[K];
};

interface BatchOperationBase {
  operation: string;
  ref: DocumentReference<DocumentData, DocumentData>;
}

export interface BatchSetOperation<T> extends BatchOperationBase {
  operation: 'set';
  data: FirestoreEntity<T>;
  options?: { merge?: boolean };
}

export interface BatchUpdateOperation<T> extends BatchOperationBase {
  operation: 'update';
  data: FirestoreEntity<Partial<T>>;
}

export interface BatchDeleteOperation extends BatchOperationBase {
  operation: 'delete';
}

export type BatchWriteOperation<T> =
  | BatchSetOperation<T>
  | BatchUpdateOperation<T>;

export type BatchOperation<T = unknown> =
  | BatchWriteOperation<T>
  | BatchDeleteOperation;
