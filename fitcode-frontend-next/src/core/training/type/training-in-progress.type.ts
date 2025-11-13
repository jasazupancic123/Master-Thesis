import type { Dayjs } from 'dayjs';

import type { TrainingComponent } from './training-component.type';
import { TrainingExerciseRecordedSet } from './training-exercise.type';
import { Superset } from './superset.type';
import { Training } from './training.type';

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
