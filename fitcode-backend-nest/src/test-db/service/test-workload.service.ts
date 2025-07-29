import { Injectable } from '@nestjs/common';
import type {
  CollectionGroup,
  CollectionReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  BatchWriteOperation,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { Component } from '@src/component/entity/component.entity';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Workload, WorkloadMeta } from '@src/training/entity/workload.entity';
import { WorkloadValue } from '@src/training/entity/workload-value.entity';
import { generateWorkloadStub } from '@src/training/mock/workload.stub';

import { AbstractTestChangeLogService } from './abstract-test-change-log.service';

@Injectable()
export class TestWorkloadService extends AbstractTestChangeLogService<Workload> {
  readonly collectionGroup: CollectionGroup;

  constructor(protected readonly firebase: FirebaseService) {
    super(firebase);
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
    input: (Create<Omit<WorkloadMeta, 'id' | 'plannedAt' | 'componentId'>> &
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
        componentId: item.component.id,
      };

      const id = this.getKey(workload);
      workload.id = id;

      const ref = this.collection(item.trainingId).doc(id);
      const query = this.firebase.buildCreateQuery<Workload>(
        generateWorkloadStub(item.component, {
          ...workload,
          randomValues: item.randomValues,
          defaultParamsKey: item.defaultParamsKey,
        }),
        { timestamps: true },
      );

      this.trackCreate(ref);
      return { operation: 'set', ref, data: query };
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
