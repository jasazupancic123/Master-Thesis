import { Group } from '../entity/group.entity';

export type CreateGroup = Pick<Group, 'name' | 'membersIds' | 'ownerId'>;

export type UpdateGroup = Partial<Pick<Group, 'name' | 'membersIds'>>;
