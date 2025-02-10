import { BaseEntity } from '@/common/type/entity.type';
import { Cycle } from './cycle.type';
import { User } from '@/controller/user/type/user.type';

export type Group = BaseEntity & {
  name: string;
  ownerId: string;
  membersIds: string[];
  cycles: Cycle[];

  // mapped properties
  members?: User[];
};
