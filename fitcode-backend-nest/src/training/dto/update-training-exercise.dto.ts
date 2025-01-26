import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { AddTrainingExerciseDto } from './add-training-exercise.dto';
import { UpdateTrainingExercise } from '../type/training-exercise.type';
import { TrainingExercise } from '../entity/training-exercise.entity';

export class UpdateTrainingExerciseDto
  extends IntersectionType(
    PartialType(AddTrainingExerciseDto),
    PickType(TrainingExercise, ['order']),
  )
  implements UpdateTrainingExercise {}
