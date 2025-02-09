import { ExerciseMeta } from '../entity/exercise-meta.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';

export type CreateUserWorkload = Pick<TrainingExercise, 'meta'>;

export type UpdateUserWorkload = CreateUserWorkload;
