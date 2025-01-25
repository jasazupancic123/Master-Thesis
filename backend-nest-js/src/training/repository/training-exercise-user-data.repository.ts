import { Injectable } from '@nestjs/common';
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
  TrainingExerciseUserDataRef,
} from '../../common/type/firebase-firestore.type';
import {
  ExerciseSetData,
  TrainingExerciseUserData,
} from '../entity/training-exercise-user-data.entity';
import { TrainingExerciseRepository } from './training-exercise.repository';
import { Query } from 'firebase-admin/lib/firestore';
import { CommonService } from '../../common/service/common.service';
import { SetStatus } from '../enum/set-status.enum';

@Injectable()
export class TrainingExerciseUserDataRepository
  implements
    FirestoreCollectionRepository<
      TrainingExerciseUserData,
      TrainingExerciseUserDataRef
    >
{
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
  ) {}

  async getDocs(
    ref: Required<TrainingExerciseRef>,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingExerciseUserData[]> {
    const snapshot = await query(this.collection(ref)).get();
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
      sets: FieldValue.arrayUnion(...data.sets),
    });

    return ref.userId;
  }

  async updateDoc(
    ref: Required<TrainingExerciseUserDataRef>,
    data: Partial<TrainingExerciseUserData>,
  ) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  async updateSetData(
    ref: Required<TrainingExerciseUserDataRef>,
    input: Partial<ExerciseSetData>[],
  ) {
    const data = input.map((item) => ({
      status: SetStatus.COMPLETED,
      setNumber: item.setNumber,
      setTypeValue: item.setTypeValue,
      workloadValue: item.workloadValue,
    }));

    await this.doc(ref).update({ sets: data });
  }

  async deleteDoc(ref: Required<TrainingExerciseUserDataRef>) {
    await this.doc(ref).delete();
  }

  doc(ref: Required<TrainingExerciseUserDataRef>): DocumentReference {
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
      trainingId: data.trainingId,
      componentId: data.componentId,
      supersetId: data.supersetId,
      exerciseId: data.exerciseId,
      workloadValue: data.workloadValue,
      sets: data.sets || [],
    };
  }
}
