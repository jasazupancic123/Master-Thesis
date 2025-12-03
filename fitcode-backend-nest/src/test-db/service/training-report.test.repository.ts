import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { TrainingComponentUserStatusRef } from '@src/common/type/firestore.type';
import { TrainingComponentUserStatus } from '@src/training/entity/training-component-user-status.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { generateTrainingComponentUserStatusStub } from '@src/training/mock/training-component-user-status.stub';
import { TrainingComponentUserStatusRepository } from '@src/training/repository/training-component-user-status.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class TrainingComponentUserStatusTestRepository extends TestRepositoryMixin<
  TrainingComponentUserStatus,
  TrainingComponentUserStatusRef
>()(TrainingComponentUserStatusRepository) {
  async createTest(
    trainingId: string,
    componentId: string,
    userId: string,
    input?: Partial<TrainingComponentUserStatus>,
  ): Promise<TrainingComponentUserStatus> {
    await this.save(
      generateTrainingComponentUserStatusStub(
        trainingId,
        componentId,
        userId,
        input,
      ),
    );

    return this.findById({ trainingId, componentId, uid: userId });
  }

  async findAll() {
    return this.collectionGroup()
      .get()
      .then((snap) =>
        snap.docs.map((doc) => doc.data() as TrainingComponentUserStatus),
      );
  }

  async deleteAllByTraining(trainingId: string): Promise<void> {
    await this.firebase.deleteCollection(
      `${FirestoreCollection.TRAINING}/${trainingId}/${FirestoreCollection.TRAINING_COMPONENT_USER_STATUS}`,
    );
  }

  async updateStatus(
    ref: TrainingComponentUserStatusRef,
    status: TrainingStatus,
  ): Promise<void> {
    const componentStatus = await this.findById(ref);
    if (!componentStatus) return;
    await this.update(ref, { status });
  }
}
