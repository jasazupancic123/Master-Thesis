import { IdEntity, TimestampEntity } from '@/common/type/entity.type';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';

export interface Institution extends IdEntity, TimestampEntity {
  name: string;
  description?: string;
  ownerId: string; // creator of the institution
  trainerIds: string[]; // all managers and trainers
  memberIds: string[]; // all athletes
  groupIds: string[];

  // mapped properties
  trainers: User[];
  members: User[];
  groups: Group[];
}
