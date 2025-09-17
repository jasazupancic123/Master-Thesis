import type { BaseEntity } from '@/common/type/entity.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Group } from '@/controller/group/type/group.type';

export interface Institution extends BaseEntity {
  name: string;
  ownerId: string; // creator of the institution
  trainerIds: string[]; // all managers and trainers
  athleteIds: string[]; // all athletes
  imageUrl: string;

  // mapped properties
  owner: AuthUser;
  trainers: AuthUser[];
  athletes: AuthUser[];
  groups: Group[];
}

export type CreateInstitution = Pick<
  Institution,
  'name' | 'ownerId' | 'imageUrl'
>;

export type UpdateInstitution = Pick<Institution, 'name' | 'imageUrl'>;

export type UserId = { userId: string };

export type UpdateMembers = UserId & { add: boolean };
