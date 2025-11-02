import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { CopiedFrom } from './copied-from.type';
import type { Subgroup, UpdateSubgroup } from './subgroup.type';
import type {
  Superset,
  SupersetRecording,
  UpdateSuperset,
} from './superset.type';
import type { IdEntity } from '@/core/entity.type';
import type { MainSet } from '@/core/training/enum/main-set.enum';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type TrainingComponent = IdEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];
    mainSet: MainSet;
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

export type TrainingComponentRecording = Omit<
  TrainingComponent,
  'supersets'
> & {
  supersets: SupersetRecording[];
};

export type CreateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'targetId'
>;

export type UpdateTrainingComponent = Pick<
  TrainingComponent,
  'id' | 'targetId' | 'mainSet' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
  subgroups: UpdateSubgroup[];
};
