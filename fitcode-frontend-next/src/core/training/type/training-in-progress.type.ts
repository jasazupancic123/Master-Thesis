import type { Dayjs } from 'dayjs';

import type { Superset } from './superset.type';
import type { Training } from './training.type';
import type { TrainingComponent } from './training-component.type';
import type { TrainingExerciseRecordedSet } from './training-exercise.type';

export type TrainingInProgress = {
  training: Training;
  selectedComponent: TrainingComponent;
  supersets: Superset[];
  startOfTraining: Dayjs | null;
  recordedSets: TrainingExerciseRecordedSet[];
  userId: string;
  lastSetCompletedAt?: Date;
  lastSetRecTimeS?: number;
};
