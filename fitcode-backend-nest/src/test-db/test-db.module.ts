import { Module } from '@nestjs/common';

import { FirebaseModule } from '@src/firebase/firebase.module';
import { GroupRepository } from '@src/group/repository/group.repository';
import { ProfileRepository } from '@src/profile/repository/profile.repository';

import { InstitutionTestRepository } from './service/institution-test.repository';
import { TestAttributeService } from './service/test-attribute.service';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TrainingTestRepository } from './service/training-test.repository';
import { WellnessTestRepository } from './service/wellness-test.repository';
import { TestDbService } from './test-db.service';

@Module({
  imports: [FirebaseModule.forRoot()],
  providers: [
    TestDbService,
    TestAttributeService,
    TestComponentService,
    TestWorkloadService,
    TestExerciseService,
    TrainingTestRepository,
    InstitutionTestRepository,
    GroupRepository,
    ProfileRepository,
    WellnessTestRepository,
  ],
  exports: [TestDbService],
})
export class TestDbModule {}
