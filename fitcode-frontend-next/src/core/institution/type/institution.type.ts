import type { BaseEntity } from '@/core/entity.type';
import type { Group } from '@/core/institution/type/group.type';
import type { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';

export interface Institution extends BaseEntity {
  name: string;
  ownerId: string; // creator of the institution
  members: PartialInstitutionMember[];
  imageUrl: string;
  exerciseRevisions?: number;

  // mapped properties
  owner: User;
  trainers: User[];
  athletes: User[];
  groups?: Group[];
}

export interface PartialInstitutionMember {
  id: string;
  role: UserRole;
}

export type CreateInstitution = Pick<
  Institution,
  'name' | 'ownerId' | 'imageUrl'
>;

export type UpdateInstitution = Partial<Pick<Institution, 'name' | 'imageUrl'>>;

export type UserId = { userId: string };

export type UpdateMembers = UserId & { add: boolean };

export type InitInstitution = Institution & {
  groups: Group[];
};
