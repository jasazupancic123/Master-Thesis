import { Injectable } from '@nestjs/common';

import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupRepository } from '@src/group/repository/group.repository';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { TestAttributeService } from './service/test-attribute.service';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TrainingTestRepository } from './service/training-test.repository';

@Injectable()
export class TestDbService {
  constructor(
    private readonly firebase: FirebaseService,
    readonly attributes: TestAttributeService,
    readonly components: TestComponentService,
    readonly workloads: TestWorkloadService,
    readonly exercises: TestExerciseService,
    readonly trainings: TrainingTestRepository,
    readonly institutions: InstitutionRepository,
    readonly groups: GroupRepository,
  ) {}

  private SERVICES = [
    this.attributes,
    this.components,
    this.workloads,
    this.exercises,
    this.trainings.changeLog,
    this.institutions.changeLog,
    this.groups.changeLog,
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
