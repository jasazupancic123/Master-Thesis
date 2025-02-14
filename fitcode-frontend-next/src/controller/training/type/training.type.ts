import { TrainingPlan } from './training-plan.type';
import { Subgroup } from './subgroup.type';
import { UserMeta } from '@/controller/user/type/user-meta.type';
import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity } from '@/common/type/entity.type';
import { User } from '@/controller/user/type/user.type';

export type Training = BaseEntity &
  Required<DateRange> & {
    groupId: string;
    cycleId: string;
    ownerId: string;
    name: string;
    membersIds: string[];
    subgroupId?: string | null;
    copiedFromId?: string;
    components: TrainingPlan;
    subgroups: { [subgroupId: string]: Subgroup };
    meta: { [userId: string]: UserMeta };

    // mapped properties
    members?: User[];
    availableMembersIds?: string[];
  };
