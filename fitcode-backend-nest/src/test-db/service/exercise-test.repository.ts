import { Injectable } from '@nestjs/common';
import slugify from 'slugify';

import { Create } from '@src/common/type/entity.type';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseRepository } from '@src/exercise/repository/exercise.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class ExerciseTestRepository extends TestRepositoryMixin<Exercise>()(
  ExerciseRepository,
) {
  async createTest(
    input: Partial<Create<Exercise>> & {
      ownerId: string;
      componentIds: string[];
    },
  ): Promise<Exercise> {
    const data = generateExerciseStub(input);
    data.id = data.id || slugify(data.name, { lower: true, strict: true });

    await this.save(data);
    return await this.findById(data.id);
  }
}
