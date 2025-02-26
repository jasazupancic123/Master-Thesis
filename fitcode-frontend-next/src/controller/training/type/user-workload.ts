import { TimestampEntity } from '@/common/type/entity.type';
import { SetStatus } from '../enum/set-status.enum';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';

export type UserWorkload = TimestampEntity & {
  userId: string;
  trainingId: string;
  exerciseId: string;
  sets: number;
  setType: SetType;
  setTypeValue: number;
  workloadType: WorkloadType;
  workloadValue: number; // calculated value prescribed by trainer
  status: SetStatus;
  data: WorkloadData[];
};

export interface WorkloadData {
  setNumber: number;
  repNumber: number;
  setTypeValue: number; // actual user reps / distance / time / ... completed
  workloadValue: string | number; // actual user kg completed
  notes?: string;
}

export interface ExerciseMetaQuery {
  exerciseId: string;
  data: WorkloadData[];
}

export interface WorkloadDataForExercise {
  setNumber: number;
  setTypeValue: number; // actual user reps / distance / time / ... completed
  workloadValue: string | number; // actual user kg completed
  notes?: string;
}


