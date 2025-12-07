import type { Dayjs } from 'dayjs';

import type { Training } from './training.type';
import type { TrainingExerciseRecordedSet } from './training-exercise.type';

export type TrainingInProgress = {
  userId: string;
  training: Training;
  componentId: string;
  startOfTraining: Dayjs | null;
  recordedSets: TrainingExerciseRecordedSet[];
  lastSetCompletedAt?: Date;
  lastSetRecTimeS?: number;
};
