import { Group } from '@/group/entity/group.entity';

export type CreateGroup = Pick<Group, 'name' | 'membersIds'>

export type UpdateGroup = Partial<CreateGroup>