import { Training } from '../entity/training.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';

export type CreateTrainingExerciseUserData = Pick<TrainingExercise, 'meta'>;

export type UpdateTrainingExerciseUserData = CreateTrainingExerciseUserData;
