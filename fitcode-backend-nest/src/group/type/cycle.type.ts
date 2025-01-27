import { Cycle } from '../entity/cycle.entity';

export type CreateCycle = Pick<
  Cycle,
  'groupId' | 'ownerId' | 'membersIds' | 'name' | 'description' | 'from' | 'to'
>;

export type UpdateCycle = Partial<
  Pick<Cycle, 'membersIds' | 'name' | 'description' | 'from' | 'to'>
>;
