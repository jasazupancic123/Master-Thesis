import { PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from '../entity/training-exercise.entity';

export class AddTrainingExercise extends PickType(TrainingExercise, ['exerciseId', 'order', 'color']) {
}