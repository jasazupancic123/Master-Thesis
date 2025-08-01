import { DateRange } from '@/common/type/date-range.type';
import { IdEntity, ColorEntity } from '@/common/type/entity.type';
import { Component } from '@/controller/component/type/component.type';
import { Method } from '@/controller/method/type/method.type';
import { Target } from '@/controller/target/type/target.type';
import { PeriodizationType } from '../enum/periodization-type.enum';
import { CopiedFrom } from './copied-from.type';
import { Subgroup, SubgroupInfo, UpdateSubgroup } from './subgroup.type';
import { Superset, UpdateSuperset } from './superset.type';

export type TrainingComponent = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];
    completedMembersIds: string[]; // members who completed the component
    methodId?: string;
    target?: Target; // selected target
    periodizationType?: PeriodizationType;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings

    // mapped properties
    method?: Method;
    component?: Component;
  };

export type TrainingComponentInfo = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    subgroups: SubgroupInfo[];
    methodId?: string;

    // mapped properties
    method?: Method;
    target?: Target; // selected target
    component?: Component;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings
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
