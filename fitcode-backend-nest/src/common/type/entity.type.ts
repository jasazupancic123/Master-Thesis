import type { Timestamp } from 'firebase-admin/firestore';

import type { Group } from '@src/institution/entity/group.entity';
import type { Institution } from '@src/institution/entity/institution.entity';
import type { Training } from '@src/training/entity/training.entity';

import type { TimestampEntity } from '../entity/timestamp.entity';
import type { User } from './firebase-auth.type';

// Base Firestore type mapping
type FirestoreType<T> = T extends Date
  ? Timestamp
  : T extends object
    ? FirestoreEntity<T> // recursively transform objects
    : T extends Array<infer U>
      ? Array<FirestoreType<U>> // recursively transform arrays
      : T;

export type FirestoreEntity<T> = {
  [K in keyof T]: FirestoreType<T[K]>;
};

export type OmitIfExtends<T, U> = T extends U ? Omit<T, keyof U> : T;

/**
 * @example
 * class User extends IntersectionType(IdEntity, TimestampEntity) {
 *   name: string;
 *   age: number;
 * }
 *
 * const data: Create<User> = { id: '1', name: 'John', age: 42 } // all properties without `createdAt`, `updatedAt`, `deletedAt`
 * const data: Create<User, 'name'> = { name: 'John' } // only selected properties without `createdAt`, `updatedAt`, `deletedAt`
 */
export type Create<
  T,
  K extends keyof OmitIfExtends<T, TimestampEntity> = keyof OmitIfExtends<
    T,
    TimestampEntity
  >,
> = Pick<OmitIfExtends<T, TimestampEntity>, K>;

/**
 * @example
 * class User extends IntersectionType(IdEntity, TimestampEntity) {
 *   name: string;
 *   age: number;
 * }
 *
 * const data: Update<User> = { id: '1', name: 'John', age: 42, updatedAt: new Date() } // all properties without `createdAt`
 * const data: Update<User, 'name'> = { name: 'John' } // only selected properties without `createdAt`
 */
export type Update<
  T,
  K extends keyof OmitIfExtends<T, 'createdAt'> = keyof OmitIfExtends<
    T,
    'createdAt'
  >,
> = {
  [P in Extract<K, keyof T>]?: T[P];
};

export type TestUser = User & { token: string };

export type TestInstitution = Institution & {
  manager: TestUser;
  trainers: TestUser[];
  athletes: TestUser[];
};

export type TestTraining = Training & { group?: Group };
