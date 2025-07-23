import { Dayjs } from 'dayjs';
import { Superset } from './superset.type';
import { TrainingComponent } from './training-component.type';
import { Training } from './training.type';

export type TrainingInProgress = {
  training: Training;
  selectedComponent: TrainingComponent;
  supersets: Superset[];
  startOfTraining: Dayjs | null;
  supersetIndex: number;
  userId: string;
};
