import { Injectable } from '@nestjs/common';

import { FirebaseService } from '@src/firebase/firebase.service';

import { GroupTestRepository } from './service/group-test.repository';
import { InstitutionTestRepository } from './service/institution-test.repository';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TrainingReportTestRepository } from './service/training-report.test.repository';
import { TrainingTestRepository } from './service/training-test.repository';
import { WellnessTestRepository } from './service/wellness-test.repository';

@Injectable()
export class TestDbService {
  constructor(
    private readonly firebase: FirebaseService,
    readonly components: TestComponentService,
    readonly workloads: TestWorkloadService,
    readonly exercises: TestExerciseService,
    readonly trainings: TrainingTestRepository,
    readonly trainingReports: TrainingReportTestRepository,
    readonly institutions: InstitutionTestRepository,
    readonly groups: GroupTestRepository,
    readonly wellness: WellnessTestRepository,
  ) {}

  private SERVICES = [
    this.components,
    this.workloads,
    this.exercises,
    this.trainings.changeLog,
    this.institutions.changeLog,
    this.groups.changeLog,
    this.wellness.changeLog,
  ];

  checkpoint() {
    for (const service of this.SERVICES) service.checkpoint();
  }

  async checkpointRestore() {
    const batch = this.firebase.firestore.batch();
    for (const service of this.SERVICES) await service.cleanup(true, batch);
    await batch.commit();
  }

  async cleanup() {
    const batch = this.firebase.firestore.batch();
    for (const service of this.SERVICES) await service.cleanup(false, batch);
    await batch.commit();
  }
}
