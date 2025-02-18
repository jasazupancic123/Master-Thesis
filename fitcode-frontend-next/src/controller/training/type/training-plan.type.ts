import { DateRange } from '@/common/type/date-range.type';
import { IdEntity } from '@/common/type/entity.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Effort } from '../enum/effort.enum';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { Subgroup } from './subgroup.type';

export type TrainingComponent = IdEntity &
  Required<DateRange> & {
    color?: string;
    supersets: Superset[];
    subgroups: Subgroup[];

    // mapped properties
    component?: Component;
  };

export type Superset = {
  color?: string;
  exercises: TrainingExercise[];
};

export type TrainingExercise = IdEntity & {
  color?: string;
  meta: ExerciseMeta;

  // mapped properties
  exercise: Exercise | null;
};

export type ExerciseMeta = {
  sets: number;
  setType: SetType;
  setTypeValue: number;
  workloadType: WorkloadType;
  workloadValue: string | number;
  tempo?: string;
  effort?: Effort;
  rec?: number;
};
