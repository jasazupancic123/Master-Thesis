import { IdEntity } from '@/common/entity/id.entity';
import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { User } from 'firebase/auth';
import { Cycle } from '@/group/entity/cycle.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';

export type Group = IdEntity & TimestampEntity & {
  name: string;
  ownerId: string;
  owner?: User;
  membersIds: string[];
  members?: User[];
  subgroups: Subgroup[];
  cycles: Cycle[];
}