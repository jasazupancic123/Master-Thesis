import type { Cycle } from './cycle.type';
import type { GroupEvent } from './group-event.type';
import type { BaseEntity, IdEntity } from '@/core/entity.type';
import type { User } from '@/core/user/type/user.type';

export type Group = BaseEntity & {
  institutionId: string;
  trainerIds: string[];
  name: string;
  shortName: string;
  membersIds: string[];
  cycles: Cycle[];
  events?: GroupEvent[];

  // mapped properties
  trainers?: User[];
  members?: User[];
};

export type CreateGroup = Pick<
  Group,
  'institutionId' | 'name' | 'shortName' | 'trainerIds' | 'membersIds'
>;

export type UpdateGroup = Partial<
  Pick<Group, 'trainerIds' | 'name' | 'shortName' | 'cycles'>
>;

export type BatchUpdateOneGroup = IdEntity & UpdateGroup;

export type BatchUpdateGroups = {
  groups: BatchUpdateOneGroup[];
};
