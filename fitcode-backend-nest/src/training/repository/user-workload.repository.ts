import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { Query } from 'firebase-admin/lib/firestore';
import { Wrapper } from 'src/common/type/wrapper.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  FirestoreCollectionRepository,
  TrainingRef,
  UserWorkloadRef,
} from '../../common/type/firebase-firestore.type';
import { UserWorkload } from '../entity/user-workload.entity';
import { TrainingRepository } from './training.repository';

@Injectable()
export class UserWorkloadRepository
  implements FirestoreCollectionRepository<UserWorkload, TrainingRef>
{
  constructor(
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {}

  async getDocs(
    ref: TrainingRef,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<UserWorkload[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(ref: UserWorkloadRef): Promise<UserWorkload | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: UserWorkloadRef, data: UserWorkload) {
    await this.doc(ref).set({
      userId: ref.userId,
      trainingId: data.trainingId,
      exerciseId: data.exerciseId,
      workloadType: data.workloadType,
      workloadValue: data.workloadValue,
      sets: data.sets,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return ref.userId;
  }

  async updateDoc(ref: UserWorkloadRef, data: Partial<UserWorkload>) {
    await this.doc(ref).update(data);
  }

  async deleteDoc(ref: UserWorkloadRef) {
    await this.doc(ref).delete();
  }

  doc(ref: UserWorkloadRef): DocumentReference {
    return this.collection(ref).doc(ref.userId);
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): UserWorkload {
    const data = snapshot.data();

    return {
      userId: snapshot.id,
      trainingId: data.trainingId,
      exerciseId: data.exerciseId,
      workloadType: data.workloadType,
      workloadValue: data.workloadValue,
      sets: data.sets,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : null,
    };
  }
}
