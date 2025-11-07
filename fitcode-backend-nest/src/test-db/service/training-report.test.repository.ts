import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { TrainingReportRef } from '@src/common/type/firestore.type';
import { TrainingReport } from '@src/training/entity/training-report.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { TrainingReportRepository } from '@src/training/repository/training-report.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class TrainingReportTestRepository extends TestRepositoryMixin<
  TrainingReport,
  TrainingReportRef
>()(TrainingReportRepository) {
  async deleteAllByTraining(trainingId: string): Promise<void> {
    await this.firebase.deleteCollection(
      `${FirestoreCollection.TRAINING}/${trainingId}/${FirestoreCollection.TRAINING_REPORT}`,
    );
  }

  async updateStatus(
    ref: TrainingReportRef,
    componentId: string,
    status: TrainingStatus,
  ): Promise<void> {
    const trainingReport = await this.findById(ref);
    if (!trainingReport) return;

    const componentStatus = trainingReport.componentStatuses.find(
      (cs) => cs.componentId === componentId,
    );

    if (!componentStatus) return;

    componentStatus.status = status;
    await this.update(ref, {
      componentStatuses: trainingReport.componentStatuses,
    });
  }
}
