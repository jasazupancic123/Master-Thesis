import type { AuthUser } from '@/core/auth/type/user.type';
import type { BaseEntity } from '@/core/entity.type';
import type { Group } from '@/core/institution/type/group.type';
import type { UserRole } from '@/core/profile/enum/user-role.enum';

export interface Institution extends BaseEntity {
  name: string;
  ownerId: string; // creator of the institution
  members: PartialInstitutionMember[];
  imageUrl: string;
  exerciseRevisions?: number;

  // mapped properties
  owner: AuthUser;
  trainers: AuthUser[];
  athletes: AuthUser[];
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
