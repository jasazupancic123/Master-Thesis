import type {
  DocumentData,
  DocumentReference,
  WithFieldValue,
} from 'firebase-admin/firestore';

import type { FirestoreEntity } from '@src/common/type/entity.type';
import type { FirebaseService } from '@src/firebase/firebase.service';

type FirestoreChange<T> =
  | { type: 'create'; ref: DocumentReference }
  | {
      type: 'update';
      ref: DocumentReference;
      previousData: FirestoreEntity<T>;
    }
  | {
      type: 'delete';
      ref: DocumentReference;
      deletedData: FirestoreEntity<T>;
    };

export abstract class AbstractTestChangeLogService<T> {
  protected readonly changeLog: FirestoreChange<T>[] = [];

  constructor(protected readonly firebase: FirebaseService) {}

  protected trackCreate(ref: DocumentReference) {
    this.changeLog.push({ type: 'create', ref });
  }

  protected async trackUpdate(ref: DocumentReference) {
    const snapshot = await ref.get();

    this.changeLog.push({
      type: 'update',
      ref,
      previousData: snapshot.data() as FirestoreEntity<T>,
    });
  }

  protected async trackDelete(ref: DocumentReference) {
    const snapshot = await ref.get();

    this.changeLog.push({
      type: 'delete',
      ref,
      deletedData: snapshot.data() as FirestoreEntity<T>,
    });
  }

  async cleanup() {
    const batch = this.firebase.firestore.batch();

    for (const change of this.changeLog.reverse()) {
      const ref = change.ref as DocumentReference<T, DocumentData>;

      switch (change.type) {
        case 'create':
          batch.delete(ref);
          break;
        case 'update':
          batch.set(ref, change.previousData as WithFieldValue<T>);
          break;
        case 'delete':
          batch.set(ref, change.deletedData as WithFieldValue<T>);
          break;
      }
    }

    await batch.commit();
    this.changeLog.length = 0;
  }
}
