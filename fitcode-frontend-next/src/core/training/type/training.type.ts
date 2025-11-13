import type { PeriodizationType } from '../enum/periodization-type.enum';
import type {
  CreateTrainingComponent,
  TrainingComponent,
  UpdateTrainingComponent,
} from './training-component.type';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { BaseEntity } from '@/core/entity.type';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type Training = BaseEntity &
  Required<DateRange> & {
    institutionId?: string;
    groupId?: string;
    cycleId?: string;
    ownerId: string;
    membersIds: string[];
    copiedFromId?: string;
    components: TrainingComponent[];

    // mapped properties
    institution?: Institution;
    group?: Group;
    cycle?: Cycle;
    members?: AuthUser[];
  };

export type CreateTraining = Pick<
  Training,
  'groupId' | 'cycleId' | 'membersIds' | 'from'
> & {
  components: CreateTrainingComponent[];
};

export type UpdateTraining = {
  components: UpdateTrainingComponent[];
};

export type FilterTrainings = DateRange &
  Partial<Pick<Training, 'groupId' | 'cycleId'>> & {
    institutionId: string;
    populate?: boolean;
    limit?: number;
  };

export type PeriodizeTrainings = {
  periodizationType: PeriodizationType;
  exerciseIds: string[];
  subgroupId?: string;
};

export type CopyTraining = Pick<DateRange, 'from'> &
  Partial<Pick<Training, 'membersIds'>>;
