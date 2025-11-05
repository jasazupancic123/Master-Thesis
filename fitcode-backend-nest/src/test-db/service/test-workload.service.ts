import { Injectable } from '@nestjs/common';
import type {
  CollectionGroup,
  CollectionReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import { WorkloadRef } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import {
  ExerciseParamField,
  ExerciseSet,
} from '@src/training/entity/exercise-set.entity';
import {
  Workload,
  WorkloadMeta,
  WorkloadPrimarySide,
  WorkloadValue,
} from '@src/training/entity/workload.entity';
import { generateWorkloadStub } from '@src/training/mock/workload.stub';

@Injectable()
export class TestWorkloadService {
  readonly collectionGroup: CollectionGroup;

  constructor(protected readonly firebase: FirebaseService) {
    this.collectionGroup = this.firebase.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );
  }

  collection(trainingId: string): CollectionReference {
    return this.firebase.firestore
      .collection(FirestoreCollection.TRAINING)
      .doc(trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }

  async getAll(trainingId: string): Promise<Workload[]> {
    return await this.collection(trainingId)
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) =>
          this.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
        ),
      );
  }

  async createMany(
    input: (Create<Omit<WorkloadMeta, 'id'>> &
      Omit<WorkloadValue, 'timestamp' | 'photoURLs'> & {
        prescribed: Partial<ExerciseSet>;
        params?: ExerciseParamField[];
        timestamp?: Date;
        photoURLs?: string[];
        random?: boolean;
      })[],
  ): Promise<void> {
    const operations: BatchWriteOperation<Workload>[] = input.map((item) => {
      const workload: Create<Workload> = generateWorkloadStub(item);
      const id = this.getKey(workload);
      workload.id = id;

      const ref = this.collection(item.trainingId).doc(id);
      const query = this.firebase.buildCreateQuery<Workload>(workload);

      return { operation: 'set', ref, data: query };
    });

    await this.firebase.paginateBatches(operations);
  }

  async update(
    input: WorkloadMeta & Update<WorkloadPrimarySide & WorkloadPrimarySide>,
  ): Promise<Workload> {
    const collection = this.collection(input.trainingId);
    const docRef = collection.doc(this.getKey(input));

    await docRef.set(this.firebase.buildUpdateQuery<Workload>(input), {
      merge: true,
    });

    return this.firebase.serialize(
      (await docRef.get()).data() as FirestoreEntity<Workload>,
    );
  }

  async deleteAll(trainingId: string): Promise<void> {
    const collection = this.collection(trainingId);
    const snapshot = await collection.get();

    const batch = this.firebase.firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  getKey(ref: WorkloadRef) {
    return `${ref.trainingId}-${ref.userId}-${ref.componentId}-${ref.exerciseId}-${ref.supersetIndex}-${ref.setNumber}`;
  }
}
