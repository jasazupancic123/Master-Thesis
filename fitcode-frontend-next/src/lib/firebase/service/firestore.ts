import type { CollectionReference, QuerySnapshot } from '@firebase/firestore';
import {
  collection,
  DocumentReference,
  type Firestore,
  GeoPoint,
  onSnapshot,
  Timestamp,
} from '@firebase/firestore';

import type { FirestoreEntity } from '../type/firestore.type';
import { getFirebaseFirestore } from '@/lib/firebase/config';

export class FirebaseFirestoreUtil {
  private firestore: Firestore;

  constructor() {
    this.firestore = getFirebaseFirestore();
  }

  serialize<T>(obj: FirestoreEntity<T>): T {
    if (obj === null || typeof obj !== 'object') return obj as T;
    if (Array.isArray(obj)) return obj.map((item) => this.serialize(item)) as T;

    if (obj instanceof Timestamp) return obj.toDate() as T;
    if (obj instanceof DocumentReference) return obj.path as T;
    if (obj instanceof GeoPoint)
      return { latitude: obj.latitude, longitude: obj.longitude } as T;

    const result: Record<string, unknown> = {};
    for (const key in obj)
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        result[key] = this.serialize(value as FirestoreEntity<unknown>);
      }

    return result as T;
  }

  /**
   * Listen to a collection
   */
  listenCollection<T>(
    path: string,
    callback: (snapshot: QuerySnapshot<FirestoreEntity<T>>) => void,
    errorCallback?: (error: Error) => void
  ) {
    const colRef = collection(this.firestore, path) as CollectionReference<
      FirestoreEntity<T>
    >;

    return onSnapshot(colRef, callback, errorCallback);
  }
}
