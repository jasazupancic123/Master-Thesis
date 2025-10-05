import type { Dayjs } from 'dayjs';

import type { SupersetRecording } from './superset.type';
import type { TrainingRecording } from './training.type';
import type { TrainingComponentRecording } from './training-component.type';
import type { ExerciseSetTracking } from '@/common/type/exercise-set-tracking-state.type';

export type TrainingInProgress = {
  training: TrainingRecording;
  selectedComponent: TrainingComponentRecording;
  supersets: SupersetRecording[];
  startOfTraining: Dayjs | null;
  supersetIndex: number;
  userId: string;
  exerciseSetTrackingState: ExerciseSetTracking[];
};
