import type { PeriodizationType } from '../enum/periodization-type.enum';
import type {
  CreateTrainingComponent,
  TrainingComponent,
  UpdateTrainingComponent,
} from './training-component.type';
import type { DateRange } from '@/common/type/date-range.type';
import type { BaseEntity } from '@/common/type/entity.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Wellness } from '@/controller/profile/type/wellness.type';

export type Training = BaseEntity &
  Required<DateRange> & {
    institutionId?: string;
    groupId?: string;
    cycleId?: string;
    ownerId: string;
    membersIds: string[];
    completedMembersIds: string[];
    copiedFromId?: string;
    warmup: TrainingComponent;
    cooldown: TrainingComponent;
    components: TrainingComponent[];
    wellness: Wellness[];

    // mapped properties
    institution?: Institution;
    group?: Group;
    cycle?: Cycle;
    members?: AuthUser[];
  };

export type CreateTraining = Pick<
  Training,
  'groupId' | 'cycleId' | 'membersIds'
> & {
  components: CreateTrainingComponent[];
};

export type UpdateTraining = Pick<Training, 'warmup' | 'cooldown'> & {
  components: UpdateTrainingComponent[];
};

export type FilterTrainings = DateRange &
  Partial<Pick<Training, 'groupId' | 'cycleId'>> & { populate?: boolean };

export type PeriodizeTrainings = {
  periodizationType: PeriodizationType;
  exerciseIds: string[];
  subgroupId?: string;
};

export type CopyTraining = Pick<DateRange, 'from'> &
  Partial<Pick<Training, 'membersIds'>>;
