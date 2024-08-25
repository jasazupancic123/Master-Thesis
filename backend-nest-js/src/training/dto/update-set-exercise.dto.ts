import { IntersectionType, OmitType, PickType } from '@nestjs/mapped-types';
import { SetExercise } from '../../set/entity/set-exercise.entity';
import { SuperExerciseInfo } from '../../exercise-info/entity/super-exercise-info.entity';

export class UpdateSetExerciseDto extends IntersectionType(
  OmitType(SuperExerciseInfo, ['id', 'setExerciseId', 'createdAt', 'updatedAt'] as const),
  PickType(SetExercise, ['order'] as const),
) {
}