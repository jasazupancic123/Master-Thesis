import { PickType } from '@nestjs/mapped-types';

import { Exercise } from '../entity/exercise.entity';

export class CreateExerciseDto extends PickType(Exercise, [
  'name',
  'componentIds',
  'imageUrl',
  'videoUrl',
  'attributeValues',
  'instruction',
] as const) {}
