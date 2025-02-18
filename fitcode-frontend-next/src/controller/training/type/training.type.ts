import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity } from '@/common/type/entity.type';
import { UserMeta } from '@/controller/user/type/user-meta.type';
import { User } from '@/controller/user/type/user.type';
import { TrainingComponent } from './training-plan.type';

export type Training = BaseEntity &
  Required<DateRange> & {
    groupId: string;
    cycleId: string;
    ownerId: string;
    name: string;
    membersIds: string[];
    subgroupId?: string | null;
    copiedFromId?: string;
    components: TrainingComponent[];
    meta: UserMeta[];

    // mapped properties
    members?: User[];
    availableMembersIds?: string[];
  };
