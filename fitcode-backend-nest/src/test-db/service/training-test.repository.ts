import { Injectable } from '@nestjs/common';

import { Training } from '@src/training/entity/training.entity';
import { TrainingRepository } from '@src/training/repository/training.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class TrainingTestRepository extends TestRepositoryMixin<Training>()(
  TrainingRepository,
) {}
