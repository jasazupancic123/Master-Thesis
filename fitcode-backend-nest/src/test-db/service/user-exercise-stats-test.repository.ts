import { Injectable } from '@nestjs/common';

import { UserExerciseStatsRef } from '@src/common/type/firestore.type';
import { UserExerciseStats } from '@src/user/entity/user-exercise-stats.entity';
import { UserExerciseStatsRepository } from '@src/user/repository/user-exercise-stats.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class UserExerciseStatsTestRepository extends TestRepositoryMixin<
  UserExerciseStats,
  UserExerciseStatsRef
>()(UserExerciseStatsRepository) {}
