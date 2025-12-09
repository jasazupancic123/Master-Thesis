import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Profile } from '@src/user/entity/profile.entity';

import { ExerciseTestRepository } from './service/exercise-test.repository';
import { GroupTestRepository } from './service/group-test.repository';
import { InstitutionTestRepository } from './service/institution-test.repository';
import { ProfileTestRepository } from './service/profile-test.repository';
import { ProtocolTestRepository } from './service/protocol-test.repository';
import { TestWorkloadService } from './service/test-workload.service';
import { TrainingComponentUserStatusTestRepository } from './service/training-report.test.repository';
import { TrainingTestRepository } from './service/training-test.repository';
import { UserExerciseStatsTestRepository } from './service/user-exercise-stats-test.repository';
import { WellnessTestRepository } from './service/wellness-test.repository';

@Injectable()
export class TestDbService {
  constructor(
    private readonly firebase: FirebaseService,
    readonly workloads: TestWorkloadService,
    readonly exercises: ExerciseTestRepository,
    readonly trainings: TrainingTestRepository,
    readonly trainingComponentUserStatus: TrainingComponentUserStatusTestRepository,
    readonly institutions: InstitutionTestRepository,
    readonly protocols: ProtocolTestRepository,
    readonly groups: GroupTestRepository,
    readonly wellness: WellnessTestRepository,
    readonly profiles: ProfileTestRepository,
    readonly userExerciseStats: UserExerciseStatsTestRepository,
  ) {}

  async clear() {
    await Promise.all([
      this.firebase.deleteCollection(FirestoreCollection.EXERCISE),
      this.firebase.deleteCollection(FirestoreCollection.INSTITUTION),
      this.firebase.deleteCollection(FirestoreCollection.GROUP),
      this.firebase.deleteCollection(FirestoreCollection.USER),
      this.firebase.deleteCollection(FirestoreCollection.TRAINING),
    ]);

    // add back profiles for global manager, admin, trainer and athlete
    for (const [uid, email] of [
      [global.athlete.uid, global.athlete.email],
      [global.trainer.uid, global.trainer.email],
      [global.manager.uid, global.manager.email],
      [global.admin.uid, global.admin.email],
    ]) {
      await this.firebase.firestore
        .collection(FirestoreCollection.USER)
        .doc(uid)
        .set(
          this.firebase.buildCreateQuery<Profile>(
            {
              uid,
              email,
              wellness: { userId: uid, date: new Date() },
            },
            { timestamps: true },
          ),
        );
    }
  }
}
