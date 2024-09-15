import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';
import {
  FirestoreCollectionRepository,
  TrainingExerciseRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingExercise } from '../entity/training-exercise.entity';
import {
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/lib/firestore';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import { TrainingSupersetRepository } from './training-superset.repository';

@Injectable()
export class TrainingExerciseRepository
  implements
    FirestoreCollectionRepository<TrainingExercise, TrainingExerciseRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
  ) {}

  async getLastOrder(ref: Required<TrainingSupersetRef>): Promise<number> {
    const snapshot = await this.collection(ref)
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return 0;
    return snapshot.docs[0].get('order');
  }

  async getDocs(
    ref: Required<TrainingSupersetRef>,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingExercise[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(
    ref: Required<TrainingExerciseRef>,
  ): Promise<TrainingExercise | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<TrainingExerciseRef>,
    data: Partial<TrainingExercise>,
  ) {
    await this.doc(ref).set({
      exerciseId: ref.exerciseId,
      order: data.order,
      color: data.color || this.commonService.color.random(),
      meta: {
        sets: data.meta?.sets || 3,
        setType: data.meta?.setType || SetType.REPS,
        setTypeValue: data.meta?.setTypeValue || 10,
        workloadType: data.meta?.workloadType || WorkloadType.KG,
        workloadValue: data.meta?.workloadValue || 20,
        tempo: data.meta?.tempo || null,
        effort: data.meta?.effort || null,
        rec: data.meta?.rec || null,
      },
    });

    return ref.exerciseId;
  }

  async updateDoc(
    ref: Required<TrainingExerciseRef>,
    data: Partial<TrainingExercise>,
  ) {
    const clean = this.commonService.object.clean(data);
    await this.doc(ref).update(clean);
  }

  doc(ref: Required<TrainingExerciseRef>): DocumentReference {
    return this.collection(ref).doc(ref.exerciseId);
  }

  collection(ref: Required<TrainingSupersetRef>): CollectionReference {
    return this.trainingSupersetRepository
      .doc(ref)
      .collection(FirestoreCollection.TRAINING_EXERCISE);
  }

  serialize(
    snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  ): TrainingExercise {
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
