import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { Effort } from '../enum/effort.enum';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Component } from '@/controller/component/type/component.type';
import { IdEntity } from '@/common/type/entity.type';

export interface TrainingPlan {
  [id: string]: TrainingComponent;
}

export type TrainingComponent = IdEntity & {
  order: number;
  color?: string;
  supersets: Superset[];

  // mapped properties
  component: Component;
};

export type Superset = {
  order: number;
  color?: string;
  exercises: {
    [exerciseId: string]: TrainingExercise;
  };
};

export type TrainingExercise = IdEntity & {
  order: number;
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
