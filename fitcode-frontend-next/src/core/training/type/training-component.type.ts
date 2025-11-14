import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { CopiedFrom } from './copied-from.type';
import type { Subgroup, UpdateSubgroup } from './subgroup.type';
import type { Superset, UpdateSuperset } from './superset.type';
import type { IdEntity } from '@/core/entity.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type TrainingComponent = IdEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];
    targetId?: string;
    periodizationType?: PeriodizationType;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings
    location?: string;

    // mapped properties
    color?: string;
  };

export type TrainingComponentWithTrainingId = TrainingComponent & {
  trainingId: string;
};

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'targetId'
>;

export type UpdateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'targetId' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
  subgroups: UpdateSubgroup[];
};
