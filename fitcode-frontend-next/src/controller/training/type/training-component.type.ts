import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { CopiedFrom } from './copied-from.type';
import type { Subgroup, UpdateSubgroup } from './subgroup.type';
import type { Superset, UpdateSuperset } from './superset.type';
import type { DateRange } from '@/common/type/date-range.type';
import type { ColorEntity, IdEntity } from '@/common/type/entity.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Method } from '@/controller/method/type/method.type';
import type { Target } from '@/controller/target/type/target.type';
import type { MainSet } from '@/controller/training/enum/main-set.enum';

export type TrainingComponent = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];
    completedMembersIds: string[]; // members who completed the component
    methodId?: string;
    mainSet: MainSet;
    target?: Target; // selected target
    periodizationType?: PeriodizationType;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings
    location?: string;

    // mapped properties
    method?: Method;
    component?: Component;
  };

export type TrainingComponentWithTrainingId = TrainingComponent & {
  trainingId: string;
};

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'from' | 'to' | 'target' | 'methodId'
>;

export type UpdateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'color' | 'from' | 'to' | 'target' | 'periodizationType' | 'methodId'
> & {
  supersets: UpdateSuperset[];
  subgroups: UpdateSubgroup[];
};

export type CopyComponent = Pick<DateRange, 'from'> & {
  componentId: string;
  copyFromTrainingId: string;
  copyToTrainingId?: string;
};
