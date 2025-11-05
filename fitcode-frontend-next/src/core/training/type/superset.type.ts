import type { MainSet } from '../enum/main-set.enum';
import type {
  TrainingExercise,
  TrainingExerciseRecording,
  UpdateTrainingExercise,
} from './training-exercise.type';

export type Superset = {
  exercises: TrainingExercise[];
  mainSet: MainSet;
  warmup?: boolean;
  cooldown?: boolean;
};

export type UpdateSuperset = Pick<
  Superset,
  'mainSet' | 'warmup' | 'cooldown'
> & {
  exercises: UpdateTrainingExercise[];
};

export type SupersetRecording = Omit<Superset, 'exercises'> & {
  exercises: TrainingExerciseRecording[];
};
