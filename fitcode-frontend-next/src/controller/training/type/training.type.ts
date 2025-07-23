import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity } from '@/common/type/entity.type';
import { Wellness } from '@/controller/user/type/wellness.type';
import { User } from '@/controller/user/type/user.type';
import {
  TrainingComponent,
  TrainingComponentInfo,
} from './training-component.type';
import { TrainingExerciseAverageStats } from './training-exercise-average-stats.type';
import { Institution } from '@/controller/institution/type/institution.type';

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
    futureStats: TrainingExerciseAverageStats[];
    wellness: Wellness[];

    // mapped properties
    members?: User[];
    institution?: Institution;
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
    futureStats: TrainingExerciseAverageStats[];
  };
