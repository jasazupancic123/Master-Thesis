import { Module } from '@nestjs/common';

import { FirebaseModule } from '@src/firebase/firebase.module';
import { InstitutionMembersRepository } from '@src/institution/repository/institution-members.repository';
import { ProfileRepository } from '@src/profile/repository/profile.repository';
import { TrainingModule } from '@src/training/training.module';

import { ExerciseTestRepository } from './service/exercise-test.repository';
import { GroupTestRepository } from './service/group-test.repository';
import { InstitutionTestRepository } from './service/institution-test.repository';
import { ProfileTestRepository } from './service/profile-test.repository';
import { ProtocolTestRepository } from './service/protocol-test.repository';
import { TestWorkloadService } from './service/test-workload.service';
import { TrainingComponentUserStatusTestRepository } from './service/training-report.test.repository';
import { TrainingTestRepository } from './service/training-test.repository';
import { WellnessTestRepository } from './service/wellness-test.repository';
import { TestDbService } from './test-db.service';

@Module({
  imports: [FirebaseModule.forRoot(), TrainingModule],
  providers: [
    TestDbService,
    TestWorkloadService,
    ExerciseTestRepository,
    TrainingComponentUserStatusTestRepository,
    InstitutionMembersRepository,
    ProtocolTestRepository,
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
