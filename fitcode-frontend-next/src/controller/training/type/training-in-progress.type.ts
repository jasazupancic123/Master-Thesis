import { Dayjs } from 'dayjs';
import { Superset, TrainingComponent } from './training-plan.type';
import { Training } from './training.type';
import { Workload } from './workload.type';

export type AthleteTrainingInProgress = {
  training: Training;
  selectedComponent: TrainingComponent;
  supersets: Superset[];
  startOfTraining: Dayjs | null;
  supersetIndex: number;
  userId: string;
};
