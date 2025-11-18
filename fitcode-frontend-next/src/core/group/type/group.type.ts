import type { Cycle } from './cycle.type';
import type { GroupEvent } from './group-event.type';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { BaseEntity, IdEntity } from '@/core/entity.type';

export type Group = BaseEntity & {
  institutionId: string;
  trainerIds: string[];
  name: string;
  membersIds: string[];
  cycles: Cycle[];
  events?: GroupEvent[];

  // mapped properties
  trainers?: AuthUser[];
  members?: AuthUser[];
};

export type CreateGroup = Pick<
  Group,
  'institutionId' | 'name' | 'trainerIds' | 'membersIds'
>;

export type UpdateGroup = Partial<
  Pick<Group, 'trainerIds' | 'name' | 'cycles'>
>;

export type BatchUpdateOneGroup = IdEntity & UpdateGroup;

export type BatchUpdateGroups = {
  groups: BatchUpdateOneGroup[];
};
