import { OmitType } from '@nestjs/mapped-types';

import { CreateExerciseDto } from './create-exercise.dto';

export class UpdateExerciseDto extends OmitType(CreateExerciseDto, [
  'isUnilateral',
] as const) {}
