import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { CopiedFrom } from './copied-from.type';
import type { Subgroup, UpdateSubgroup } from './subgroup.type';
import type {
  Superset,
  SupersetRecording,
  UpdateSuperset,
} from './superset.type';
import type { DateRange } from '@/lib/common/type/date-range.type';
import type { IdEntity } from '@/core/entity.type';
import type { Component } from '@/core/component/type/component.type';
import type { Method } from '@/core/method/type/method.type';
import type { Target } from '@/core/target/type/target.type';
import type { MainSet } from '@/core/training/enum/main-set.enum';

export type TrainingComponent = IdEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];
    methodId?: string;
    mainSet: MainSet;
    target?: Target; // selected target
    periodizationType?: PeriodizationType;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings
    location?: string;

    // mapped properties
    method?: Method;
    component?: Component;
    color?: string;
  };

export type TrainingComponentWithTrainingId = TrainingComponent & {
  trainingId: string;
};

export type TrainingComponentRecording = Omit<
  TrainingComponent,
  'supersets'
> & {
  supersets: SupersetRecording[];
};

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'target' | 'methodId'
>;

export type UpdateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'target' | 'methodId' | 'mainSet' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
  subgroups: UpdateSubgroup[];
};
