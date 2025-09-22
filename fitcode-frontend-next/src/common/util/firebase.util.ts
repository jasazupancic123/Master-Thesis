import { DocumentReference, GeoPoint, Timestamp } from 'firebase/firestore';

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

export function firestoreSerialize<T>(obj: FirestoreEntity<T>): T {
  if (obj === null || typeof obj !== 'object') return obj as T;
  if (Array.isArray(obj))
    return obj.map((item) => firestoreSerialize(item)) as T;

  if (obj instanceof Timestamp) return obj.toDate() as T;
  if (obj instanceof DocumentReference) return obj.path as T;
  if (obj instanceof GeoPoint)
    return { latitude: obj.latitude, longitude: obj.longitude } as T;

  const result: Record<string, unknown> = {};
  for (const key in obj)
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      result[key] = firestoreSerialize(value as FirestoreEntity<unknown>);
    }

  return result as T;
}
