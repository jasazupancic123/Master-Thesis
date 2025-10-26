import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  TrainingRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Workload } from '@src/training/entity/workload.entity';
import { TrainingRepository } from '@src/training/repository/training.repository';

@Injectable()
export class WorkloadRepository extends FirestoreRepository<
  Workload,
  TrainingRef
> {
  collectionName = FirestoreCollection.TRAINING_WORKLOAD;

  constructor(
    readonly firebase: FirebaseService,
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {
    super(firebase);
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(this.collectionName);
  }

  collectionGroup(): CollectionGroup {
    return this.firebase.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: WorkloadRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  async save(ref: WorkloadRef, data: Create<Workload>) {
    const query = this.firebase.buildCreateQuery<Workload>(data, {
      timestamps: true,
    });

    await this.doc(ref).set(query);
    return this.getKey(ref);
  }

  async update(ref: WorkloadRef, data: Update<Workload>) {
    const query = this.firebase.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async delete(ref: WorkloadRef) {
    await this.doc(ref).delete();
  }

  async deleteDocs(ref: WorkloadRef[]) {
    const batch = this.firebase.firestore.batch();
    ref.forEach((r) => batch.delete(this.doc(r)));
    await batch.commit();
  }

  async findExerciseMax(
    userId: string,
    exerciseId: string,
    range = 30, // days
  ): Promise<Workload | null> {
    const snapshot = await this.collectionGroup()
      .where('userId', '==', userId)
      .where('exerciseId', '==', exerciseId)
      .where('timestamp', '>=', subDays(new Date(), range))
      .orderBy('loadKg', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return this.firebase.serialize(
      snapshot.docs[0].data() as FirestoreEntity<Workload>,
    );
  }

  getKey(ref: WorkloadRef) {
    return `${ref.trainingId}-${ref.userId}-${ref.componentId}-${ref.exerciseId}-${ref.supersetIndex}-${ref.setNumber}`;
  }
}
