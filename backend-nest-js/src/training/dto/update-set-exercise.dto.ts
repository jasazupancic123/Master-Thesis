import { IntersectionType, OmitType, PickType } from '@nestjs/mapped-types';
import { SetExerciseEntity } from '../../set/entity/set-exercise.entity';
import { SuperExerciseInfoEntity } from '../../exercise-info/entity/super-exercise-info.entity';

export class UpdateSetExerciseDto extends IntersectionType(
  OmitType(SuperExerciseInfoEntity, ['id', 'setExerciseId', 'createdAt', 'updatedAt'] as const),
  PickType(SetExerciseEntity, ['order'] as const),
) {
}