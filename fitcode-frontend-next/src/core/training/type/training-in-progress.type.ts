import type { Dayjs } from 'dayjs';

import type { SupersetRecording } from './superset.type';
import type { TrainingRecording } from './training.type';
import type { TrainingComponentRecording } from './training-component.type';
import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';

export type TrainingInProgress = {
  training: TrainingRecording;
  selectedComponent: TrainingComponentRecording;
  supersets: SupersetRecording[];
  startOfTraining: Dayjs | null;
  userId: string;
  exerciseSetTrackingState: ExerciseSetTracking[];
  lastSetCompletedAt?: Date;
  lastSetRecTimeS?: number;
};
