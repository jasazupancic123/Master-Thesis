import { Injectable } from '@nestjs/common';
import type {
  CollectionGroup,
  CollectionReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Workload, WorkloadMeta } from '@src/training/entity/workload.entity';
import {
  CompletedWorkload,
  PrescribedWorkload,
  WorkloadValue,
} from '@src/training/entity/workload-value.entity';
import {
  BatchWriteOperation,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { generateWorkloadStub } from '@src/training/mock/workload.stub';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import { Component } from '@src/component/entity/component.entity';

@Injectable()
export class TestWorkloadService {
  readonly collectionGroup: CollectionGroup;

  constructor(private readonly firebase: FirebaseService) {
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

  async createManyCompleted(
    input: (Create<
      Omit<WorkloadMeta, 'id' | 'status' | 'plannedAt' | 'componentId'>
    > &
      WorkloadValue & {
        component: Component;
        randomValues?: boolean;
        defaultParamsKey?: string;
      })[],
  ): Promise<void> {
    const operations: BatchWriteOperation<Workload>[] = input.map((item) => {
      const workload: Create<Workload> = {
        ...item,
        id: null,
        plannedAt: new Date(),
        status: SetStatus.COMPLETED,
        componentId: item.component.id,
      };

      const id = this.getKey(workload);
      workload.id = id;

      return {
        operation: 'set',
        ref: this.collection(item.trainingId).doc(id),
        data: this.firebase.buildCreateQuery<Workload>(
          generateWorkloadStub(item.component, {
            ...workload,
            randomValues: item.randomValues,
            defaultParamsKey: item.defaultParamsKey,
          }),
          { timestamps: true },
        ),
      };
    });

    await this.firebase.paginateBatchWrites(operations);
  }

  async update(input: WorkloadMeta & Update<WorkloadValue>): Promise<Workload> {
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
