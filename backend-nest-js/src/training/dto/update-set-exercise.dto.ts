import { IntersectionType, OmitType, PickType } from '@nestjs/mapped-types';
import { SetExercise } from '../../set/entity/set-exercise.entity';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';

export class UpdateSetExerciseDto extends IntersectionType(
  OmitType(TrainingExerciseMeta, ['id', 'setExerciseId', 'createdAt', 'updatedAt'] as const),
  PickType(SetExercise, ['order'] as const),
) {
}