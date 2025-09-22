import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';
import { Query } from 'firebase-admin/lib/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  TrainingRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Workload } from '../entity/workload.entity';
import { TrainingRepository } from './training.repository';

@Injectable()
export class WorkloadRepository extends FirestoreRepository<
  Workload,
  TrainingRef
> {
  collectionName = FirestoreCollection.TRAINING_WORKLOAD;

  constructor(
    readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {
    super(firebaseService);
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(this.collectionName);
  }

  collectionGroup(): CollectionGroup {
    return this.firebaseService.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: WorkloadRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  async getAllDocs(
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<Workload[]> {
    const snapshot = await query(this.collectionGroup()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Workload>),
    );
  }

  async save(ref: WorkloadRef, data: Create<Workload>) {
    const query = this.firebaseService.buildCreateQuery<Workload>(data, {
      timestamps: true,
    });

    await this.doc(ref).set(query);
    return this.getKey(ref);
  }

  async update(ref: WorkloadRef, data: Update<Workload>) {
    const query = this.firebaseService.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async delete(ref: WorkloadRef) {
    await this.doc(ref).delete();
  }

  async deleteDocs(ref: WorkloadRef[]) {
    const batch = this.firebaseService.firestore.batch();
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
      .where('createdAt', '>=', subDays(new Date(), range))
      .orderBy('intWork1ValueL', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return this.firebaseService.serialize(
      snapshot.docs[0].data() as FirestoreEntity<Workload>,
    );
  }

  getKey(ref: WorkloadRef) {
    return `${ref.trainingId}-${ref.userId}-${ref.componentId}-${ref.exerciseId}-${ref.supersetIndex}-${ref.setNumber}`;
  }
}
