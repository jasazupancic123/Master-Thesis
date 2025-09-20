import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
  TrainingReportRef,
} from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { TrainingReport } from '../entity/training-report.entity';
import { TrainingRepository } from './training.repository';

@Injectable()
export class TrainingReportRepository extends FirestoreRepository<
  TrainingReport,
  TrainingReportRef
> {
  collectionName = FirestoreCollection.TRAINING_REPORT;

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

  doc(ref: TrainingReportRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  async getAllDocs(
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingReport[]> {
    const snapshot = await query(this.collectionGroup()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(
        doc.data() as FirestoreEntity<TrainingReport>,
      ),
    );
  }

  async save(ref: TrainingReportRef, data: Create<TrainingReport>) {
    const query = this.firebaseService.buildCreateQuery<TrainingReport>(data, {
      timestamps: true,
    });

    await this.doc(ref).set(query);
    return this.getKey(ref);
  }

  async update(ref: TrainingReportRef, data: Update<TrainingReport>) {
    const query = this.firebaseService.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async delete(ref: TrainingReportRef) {
    await this.doc(ref).delete();
  }

  getKey(ref: TrainingReportRef) {
    return `${ref.trainingId}-${ref.userId}`;
  }
}
