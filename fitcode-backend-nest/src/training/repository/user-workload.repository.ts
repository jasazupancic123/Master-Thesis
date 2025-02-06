import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import {
  FirestoreCollectionRepository,
  TrainingExerciseRef,
  TrainingRef,
  UserWorkloadExerciseRef,
  UserWorkloadRef,
} from '../../common/type/firebase-firestore.type';
import { UserWorkload } from '../entity/user-workload.entity';
import { SetData } from '../entity/set-data';
import { Query } from 'firebase-admin/lib/firestore';
import { CommonService } from '../../common/service/common.service';
import { SetStatus } from '../enum/set-status.enum';
import { FirebaseService } from 'src/firebase/firebase.service';
import { TrainingService } from '../service/training.service';
import { Wrapper } from 'src/common/type/wrapper.type';
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
    ref: Required<TrainingRef>,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<UserWorkload[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(ref: Required<UserWorkloadRef>): Promise<UserWorkload | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<UserWorkloadRef>, data: UserWorkload) {
    await this.doc(ref).set({
      userId: ref.userId,
      trainingId: data.trainingId,
      exercises: data.exercises,
    });

    return ref.userId;
  }

  async updateDoc(ref: Required<UserWorkloadRef>, data: Partial<UserWorkload>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  async deleteDoc(ref: Required<UserWorkloadRef>) {
    await this.doc(ref).delete();
  }

  doc(ref: Required<UserWorkloadRef>): DocumentReference {
    return this.collection(ref).doc(ref.userId);
  }

  collection(ref: Required<TrainingRef>): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): UserWorkload {
    const data = snapshot.data();

    return {
      userId: snapshot.id,
      trainingId: data.trainingId,
      subgroupId: data.subgroupId || null,
      exercises: data.exercises || {},
    };
  }
}
