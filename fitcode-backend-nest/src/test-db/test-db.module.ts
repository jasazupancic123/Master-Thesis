import { Module } from '@nestjs/common';

import { FirebaseModule } from '@src/firebase/firebase.module';
import { ProfileRepository } from '@src/profile/repository/profile.repository';
import { TrainingModule } from '@src/training/training.module';

import { GroupTestRepository } from './service/group-test.repository';
import { InstitutionTestRepository } from './service/institution-test.repository';
import { ProfileTestRepository } from './service/profile-test.repository';
import { TestComponentService } from './service/test-component.service';
import { TestExerciseService } from './service/test-exercise.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TrainingReportTestRepository } from './service/training-report.test.repository';
import { TrainingTestRepository } from './service/training-test.repository';
import { WellnessTestRepository } from './service/wellness-test.repository';
import { TestDbService } from './test-db.service';

@Module({
  imports: [FirebaseModule.forRoot(), TrainingModule],
  providers: [
    TestDbService,
    TestComponentService,
    TestWorkloadService,
    TestExerciseService,
    TrainingReportTestRepository,
    InstitutionTestRepository,
    GroupTestRepository,
    ProfileRepository,
    ProfileTestRepository,
    WellnessTestRepository,
    TrainingTestRepository,
  ],
  exports: [TestDbService],
})
export class TestDbModule {}
