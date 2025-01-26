import { IdEntity } from '@/common/entity/id.entity';
import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { Cycle } from '@/group/entity/cycle.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { User } from '@/user/type/user.type';

export type Group = IdEntity & TimestampEntity & {
  name: string;
  ownerId: string;
  owner?: User;
  membersIds: string[];
  availableMembersIds?: string[];
  members?: User[];
  subgroups: Subgroup[];
  cycles: Cycle[];
}