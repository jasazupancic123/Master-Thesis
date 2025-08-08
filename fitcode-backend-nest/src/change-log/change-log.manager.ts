import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ChangeLogManager<T> {
  private changeLog: FirestoreChange<T>[] = [];
  private checkpointIndex: number | null = null;

  constructor(private readonly firebase: FirebaseService) {}

  trackCreate(ref: DocumentReference) {
    this.changeLog.push({ type: 'create', ref });
  }

  async trackUpdate(ref: DocumentReference) {
    const snapshot = await ref.get();
    this.changeLog.push({
      type: 'update',
      ref,
      previousData: snapshot.data() as FirestoreEntity<T>,
    });
  }

  async trackDelete(ref: DocumentReference) {
    const snapshot = await ref.get();
    if (!snapshot.exists) return;

    this.changeLog.push({
      type: 'delete',
      ref,
      deletedData: snapshot.data() as FirestoreEntity<T>,
    });
  }

  checkpoint() {
    this.checkpointIndex = this.changeLog.length;
  }

  clearCheckpoint() {
    this.checkpointIndex = null;
  }

  clearChangeLog() {
    this.changeLog.length = 0;
    this.clearCheckpoint();
  }

  async cleanup(
    fromCheckpointOnly = false,
    batch?: FirebaseFirestore.WriteBatch,
  ) {
    let localBatch = batch || this.firebase.firestore.batch();

    const startIndex =
      fromCheckpointOnly && this.checkpointIndex !== null
        ? this.checkpointIndex
        : 0;

    const logToRevert = this.changeLog.slice(startIndex).reverse();

    for (const change of logToRevert) {
      const ref = change.ref as DocumentReference<T, DocumentData>;

      switch (change.type) {
        case 'create':
          localBatch.delete(ref);
          break;
        case 'update':
          localBatch.set(ref, change.previousData as WithFieldValue<T>);
          break;
        case 'delete':
          localBatch.set(ref, change.deletedData as WithFieldValue<T>);
          break;
      }
    }

    if (!batch) await localBatch.commit();

    this.changeLog = this.changeLog.slice(0, startIndex);
    if (!fromCheckpointOnly) this.clearCheckpoint();
  }
}
