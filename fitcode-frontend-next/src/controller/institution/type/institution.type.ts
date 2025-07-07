import { BaseEntity } from '@/common/type/entity.type';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';

export interface Institution extends BaseEntity {
  name: string;
  ownerId: string; // creator of the institution
  trainerIds: string[]; // all managers and trainers
  athleteIds: string[]; // all athletes
  imageUrl: string;

  // mapped properties
  owner: User;
  trainers: User[];
  athletes: User[];
  groups: Group[];
}
