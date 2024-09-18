import { Group } from '../entity/group.entity';

export type CreateGroup = Pick<Group, 'name' | 'membersIds'>;

export type UpdateGroup = Partial<Pick<Group, 'name' | 'membersIds'>>;
