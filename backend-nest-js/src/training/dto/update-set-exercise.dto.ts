import { SuperExerciseInfoEntity } from '../../exercise-info/entity/super-exercise-info.entity';
import { IntersectionType, OmitType, PickType } from '@nestjs/mapped-types';
import { SetExerciseEntity } from '../../set/entity/set-exercise.entity';

export class UpdateSetExerciseDto extends IntersectionType(
  PickType(SetExerciseEntity, ['order'] as const),
  OmitType(SuperExerciseInfoEntity, ['id', 'setExerciseId', 'createdAt', 'updatedAt'] as const),
) {
}