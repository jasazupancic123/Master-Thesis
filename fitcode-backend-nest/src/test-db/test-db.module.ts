import { Module } from '@nestjs/common';

import { FirebaseModule } from '@src/firebase/firebase.module';
import { GroupRepository } from '@src/group/repository/group.repository';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';
import { TrainingRepository } from '@src/training/repository/training.repository';

import { TestAttributeService } from './service/test-attribute.service';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TestDbService } from './test-db.service';

@Module({
  imports: [FirebaseModule.forRoot()],
  providers: [
    TestDbService,
    TestAttributeService,
    TestComponentService,
    TestWorkloadService,
    TestExerciseService,
    TrainingRepository,
    InstitutionRepository,
    GroupRepository,
  ],
  exports: [TestDbService],
})
export class TestDbModule {}
