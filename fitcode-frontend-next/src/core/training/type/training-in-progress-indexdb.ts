import { Dayjs } from 'dayjs';
import { TrainingExerciseRecordedSet } from './training-exercise.type';

export type TrainingInProgressIndexDB = {
  startOfTraining: Dayjs | null;
  recordedSets: TrainingExerciseRecordedSet[];
};
