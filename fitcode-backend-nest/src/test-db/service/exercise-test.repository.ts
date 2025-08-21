import { Injectable } from '@nestjs/common';

import { ExerciseRepository } from '@src/exercise/repository/exercise.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class ExerciseTestRepository extends TestRepositoryMixin(
  ExerciseRepository,
) {}
