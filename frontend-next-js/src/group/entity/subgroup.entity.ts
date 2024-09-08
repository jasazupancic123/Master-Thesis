import { IdEntity } from '@/common/entity/id.entity';
import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { User } from '@/user/type/user.type';
import { Cycle } from '@/group/entity/cycle.entity';

export type Subgroup = IdEntity & TimestampEntity & {
  name: string;
  cycleId: string;
  cycle?: Cycle;
  membersIds: string[];
  members?: User[];
  from: Date;
  to: Date;
}