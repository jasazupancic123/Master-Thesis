import { DateRange } from '@/common/type/date-range.type';
import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Effort } from '../enum/effort.enum';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { Subgroup } from './subgroup.type';

export type TrainingComponent = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];

    // mapped properties
    component?: Component;
  };

export type Superset = ColorEntity & {
  exercises: TrainingExercise[];
};

export type TrainingExercise = IdEntity &
  ColorEntity & {
    meta: ExerciseMeta;

    // mapped properties
    exercise?: Exercise;
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
