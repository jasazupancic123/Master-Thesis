import type { BaseEntity } from '@/common/type/entity.type';
import type { Group } from '@/controller/group/type/group.type';
import type { User } from '@/controller/user/type/user.type';

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

export type CreateInstitution = Pick<
  Institution,
  'name' | 'ownerId' | 'imageUrl'
>;

export type UpdateInstitution = Pick<Institution, 'name' | 'imageUrl'>;

export type UserId = { userId: string };

export type UpdateMembers = UserId & { add: boolean };
