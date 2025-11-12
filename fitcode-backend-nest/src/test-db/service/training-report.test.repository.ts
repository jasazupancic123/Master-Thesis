import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { TrainingComponentUserStatusRef } from '@src/common/type/firestore.type';
import { TrainingComponentUserStatus } from '@src/training/entity/training-component-user-status.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { TrainingComponentUserStatusRepository } from '@src/training/repository/training-user-status.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class TrainingComponentUserStatusTestRepository extends TestRepositoryMixin<
  TrainingComponentUserStatus,
  TrainingComponentUserStatusRef
>()(TrainingComponentUserStatusRepository) {
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
