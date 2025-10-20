import type { Timestamp } from '@firebase/firestore';

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
