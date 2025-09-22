import type { CollectionReference, QuerySnapshot } from '@firebase/firestore';
import { collection, type Firestore, onSnapshot } from '@firebase/firestore';

import type { FirestoreEntity } from '../util/firebase.util';
import { getFirebaseFirestore } from '@/common/config/firebase.config';

export class FirebaseFirestoreUtil {
  private static instance: FirebaseFirestoreUtil;
  private firestore: Firestore;

  private constructor() {
    this.firestore = getFirebaseFirestore();
  }

  static get Instance() {
    if (!this.instance) this.instance = new FirebaseFirestoreUtil();
    return this.instance;
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
