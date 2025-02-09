import { BaseEntity } from '@/common/type/entity.type';
import { Cycle } from './cycle.type';

export type Group = BaseEntity & {
  name: string;
  ownerId: string;
  membersIds: string[];
  cycles: Cycle[];
};
