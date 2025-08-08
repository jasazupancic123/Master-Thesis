import { Injectable } from '@nestjs/common';

import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { TestAttributeService } from './service/test-attribute.service';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestTrainingService } from './service/test-training.service';
import { TestWorkloadService } from './service/test-workload.service';

@Injectable()
export class TestDbService {
  constructor(
    private readonly firebase: FirebaseService,
    readonly attributes: TestAttributeService,
    readonly components: TestComponentService,
    readonly trainings: TestTrainingService,
    readonly workloads: TestWorkloadService,
    readonly exercises: TestExerciseService,
    readonly institutions: InstitutionRepository,
  ) {}

  private SERVICES = [
    this.attributes,
    this.components,
    this.trainings,
    this.workloads,
    this.exercises,
    this.institutions.changeLog,
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
