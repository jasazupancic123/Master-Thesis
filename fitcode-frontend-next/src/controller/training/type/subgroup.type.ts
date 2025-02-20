import { IdEntity } from '@/common/type/entity.type';
import { User } from '@/controller/user/type/user.type';
import { Superset } from './training-plan.type';

export type Subgroup = IdEntity & {
  name: string;
  membersIds: string[];
  supersets: Superset[];
  color?: string;

  // mapped properties
  members?: User[];
};
