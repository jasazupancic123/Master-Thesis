import { BaseEntity } from '@/common/type/entity.type';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';

export type Organization = BaseEntity & {
  name: string;

  // mapped properties
  manager: User;
  trainers: User[];
  groups: Group[];
};
