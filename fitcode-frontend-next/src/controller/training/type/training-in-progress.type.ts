import type { Dayjs } from 'dayjs';

import type { Superset } from './superset.type';
import type { Training } from './training.type';
import type { TrainingComponent } from './training-component.type';
import type { ExerciseSetTracking } from '@/common/type/exercise-set-tracking-state.type';

export type TrainingInProgress = {
  training: Training;
  selectedComponent: TrainingComponent;
  supersets: Superset[];
  startOfTraining: Dayjs | null;
  supersetIndex: number;
  userId: string;
  exerciseSetTrackingState: ExerciseSetTracking[];
};
