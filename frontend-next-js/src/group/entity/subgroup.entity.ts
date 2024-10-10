import { IdEntity } from '@/common/entity/id.entity';
import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { User } from '@/user/type/user.type';

export type Subgroup = IdEntity & TimestampEntity & {
  name: string;
  membersIds: string[];
  members?: User[];
  from: Date;
  to: Date;
}