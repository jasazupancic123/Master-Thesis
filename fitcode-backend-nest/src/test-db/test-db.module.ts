import { Module } from '@nestjs/common';

import { FirebaseModule } from '@src/firebase/firebase.module';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { TestAttributeService } from './service/test-attribute.service';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestTrainingService } from './service/test-training.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TestDbService } from './test-db.service';

@Module({
  imports: [FirebaseModule.forRoot()],
  providers: [
    TestDbService,
    TestAttributeService,
    TestComponentService,
    TestTrainingService,
    TestWorkloadService,
    TestExerciseService,
    InstitutionRepository,
  ],
  exports: [TestDbService],
})
export class TestDbModule {}
