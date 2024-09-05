import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import {
  FirestoreCollectionRepository,
  TrainingComponentRef,
  TrainingExerciseRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingComponentRepository } from './training-component.repository';
import { DocumentSnapshot, Query, QueryDocumentSnapshot } from 'firebase-admin/lib/firestore';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class TrainingExerciseRepository implements FirestoreCollectionRepository<TrainingExercise, TrainingExerciseRef> {
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingComponentRepository: TrainingComponentRepository,
  ) {
  }

  async getDocs(
    ref: Required<TrainingComponentRef>,
    query: (ref: Query) => Query = ref => ref,
  ): Promise<TrainingExercise[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async getDoc(ref: Required<TrainingExerciseRef>): Promise<TrainingExercise | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<TrainingExerciseRef>, data: Partial<TrainingExercise>) {
    await this.doc(ref).set({
      exerciseId: ref.exerciseId,
      order: data.order,
      color: data.color || this.commonService.color.random(),
      meta: data.meta || {
        sets: 3,
        setType: SetType.REPS,
        setTypeValue: 10,
        workloadType: WorkloadType.KG,
        workloadValue: 20,
      },
    });

    return ref.exerciseId;
  }

  async updateDoc(ref: Required<TrainingExerciseRef>, data: Partial<TrainingExercise>) {
    const clean = this.commonService.object.clean(data);
    await this.doc(ref).update(clean);
  }

  doc(ref: Required<TrainingExerciseRef>): DocumentReference {
    return this.collection(ref).doc(ref.exerciseId);
  }

  collection(ref: Required<TrainingComponentRef>): CollectionReference {
    return this.trainingComponentRepository.doc(ref).collection(FirestoreCollection.TRAINING_EXERCISE);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): TrainingExercise {
    const data = snapshot.data();

    return {
      exerciseId: snapshot.id,
      order: +data.order,
      color: data.color,
      meta: data.meta,
      data: [],
    } as TrainingExercise;
  }
}