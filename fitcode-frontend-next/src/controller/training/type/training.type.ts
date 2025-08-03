import type { PeriodizationType } from '../enum/periodization-type.enum';
import type {
  CreateTrainingComponent,
  TrainingComponent,
  TrainingComponentInfo,
  UpdateTrainingComponent,
} from './training-component.type';
import type { TrainingExerciseAverageStats } from './training-exercise-average-stats.type';
import type { CreatePrescribedWorkload } from './workload.type';
import type { DateRange } from '@/common/type/date-range.type';
import type { BaseEntity } from '@/common/type/entity.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { User } from '@/controller/user/type/user.type';
import type { Wellness } from '@/controller/user/type/wellness.type';

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
    stats: TrainingExerciseAverageStats[];
    prescribedStats: TrainingExerciseAverageStats[];
    wellness: Wellness[];

    // mapped properties
    institution?: Institution;
    group?: Group;
    cycle?: Cycle;
    members?: User[];
  };

export type TrainingInfo = BaseEntity &
  Required<DateRange> & {
    institutionId?: string;
    groupId?: string;
    cycleId?: string;
    copiedFromId?: string;
    warmup: TrainingComponentInfo;
    cooldown: TrainingComponentInfo;
    components: TrainingComponentInfo[];
    stats: TrainingExerciseAverageStats[];
    prescribedStats: TrainingExerciseAverageStats[];
  };

export type CreateTraining = Pick<
  Training,
  'groupId' | 'cycleId' | 'membersIds'
> & {
  components: CreateTrainingComponent[];
};

export type UpdateTraining = Pick<
  Training,
  'membersIds' | 'warmup' | 'cooldown'
> & {
  components: UpdateTrainingComponent[];
  workloads?: CreatePrescribedWorkload[]; // custom workloads
};

export type FilterTrainings = DateRange &
  Partial<Pick<Training, 'groupId' | 'cycleId'>>;

export type PeriodizeTrainings = {
  baseTrainingId: string;
  componentId: string;
  periodizationType: PeriodizationType;
  exerciseIds: string[];
  subgroupId?: string;
};

export type CopyTraining = Pick<DateRange, 'from'> &
  Partial<Pick<Training, 'membersIds'>>;
