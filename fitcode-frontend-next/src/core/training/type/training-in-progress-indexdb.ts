import type { Dayjs } from 'dayjs';

import type { TrainingExerciseRecordedSet } from './training-exercise.type';

export type TrainingInProgressIndexDB = {
  startOfTraining: Dayjs | null;
  recordedSets: TrainingExerciseRecordedSet[];
};
