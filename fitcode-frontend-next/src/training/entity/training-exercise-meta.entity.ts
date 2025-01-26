import { SetType } from '@/training/enum/set-type.enum';
import { WorkloadType } from '@/training/enum/workload-type.enum';
import { Effort } from '@/training/enum/effort.enum';

export type TrainingExerciseMeta = {
  sets: number;
  setType: SetType;
  setTypeValue: number;
  workloadType: WorkloadType;
  workloadValue: string | number;
  tempo?: string;
  effort?: Effort;
  rec?: number;
}