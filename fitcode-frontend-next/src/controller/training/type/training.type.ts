import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity, TimestampEntity } from '@/common/type/entity.type';
import { Wellness } from '@/controller/user/type/wellness.type';
import { User } from '@/controller/user/type/user.type';
import { SetStatus } from '../enum/set-status.enum';
import { TrainingComponent } from './training-plan.type';
import { GroupWorkloadStats } from './average-workload-values.type';

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
    stats: GroupWorkloadStats[];
    futureStats: GroupWorkloadStats[];
    wellness: Wellness[];

    // mapped properties
    members?: User[];
  };

export type TrainingStatus = TimestampEntity & {
  userId: string;
  trainingId: string;
  componentId: string;
  status: SetStatus;
};
