import { PickType } from '@nestjs/mapped-types';
import { Exercise } from '../entity/exercise.entity';

export class CreateExerciseDto extends PickType(Exercise, [
  'name',
  'componentId',
  'imageUrl',
  'videoUrl',
  'region',
  'attributeValues',
  'coordination',
  'instruction',
  'tags',
] as const) {}
