import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import {
  FirestoreCollectionRepository,
  TrainingExerciseRef,
  TrainingExerciseUserDataRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingExerciseUserData } from '../entity/training-exercise-user-data.entity';
import { TrainingExerciseRepository } from './training-exercise.repository';

@Injectable()
export class TrainingExerciseUserDataRepository
  implements
    FirestoreCollectionRepository<
      TrainingExerciseUserData,
      TrainingExerciseUserDataRef
    >
{
  constructor(
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
  ) {}

  async getDocs(
    ref: Required<TrainingExerciseRef>,
  ): Promise<TrainingExerciseUserData[]> {
    const snapshot = await this.collection(ref).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(
    ref: Required<TrainingExerciseUserDataRef>,
  ): Promise<TrainingExerciseUserData | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<TrainingExerciseUserDataRef>,
    data: TrainingExerciseUserData,
  ) {
    await this.doc(ref).set({
      userId: ref.userId,
      workloadValue: data.workloadValue || null,
      completedSets: data.completedSets || 0,
      completedSetTypeValue: data.completedSetTypeValue || null,
      completedWorkloadValue: data.completedWorkloadValue || null,
    });

    return ref.userId;
  }

  async updateDoc(
    ref: Required<TrainingExerciseUserDataRef>,
    data: Partial<TrainingExerciseUserData>,
  ) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: Required<TrainingExerciseUserDataRef>): DocumentReference {
    if (!ref.userId) throw new Error('userId is required');
    return this.collection(ref).doc(ref.userId);
  }

  collection(ref: Required<TrainingExerciseRef>): CollectionReference {
    return this.trainingExerciseRepository
      .doc(ref)
      .collection(FirestoreCollection.TRAINING_EXERCISE_USER_DATA);
  }

  serialize(
    snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  ): TrainingExerciseUserData {
    const data = snapshot.data();

    return {
      userId: snapshot.id,
      exerciseId: data.exerciseId,
      workloadValue: data.workloadValue,
      completedSets: data.completedSets,
      completedSetTypeValue: data.completedSetTypeValue || null,
      completedWorkloadValue: data.completedWorkloadValue || null,
    };
  }
}
