import type { AuthProfileMerged, AuthUser } from '@/core/auth/type/user.type';
import type { BaseEntity } from '@/core/entity.type';
import type { Group } from '@/core/institution/type/group.type';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';

export interface Institution extends BaseEntity {
  name: string;
  ownerId: string; // creator of the institution
  trainerIds: string[]; // all managers and trainers
  athleteIds: string[]; // all athletes
  imageUrl: string;
  exercisesRevision?: number;

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

export type UpdateInstitution = Partial<Pick<Institution, 'name' | 'imageUrl'>>;

export type UserId = { userId: string };

export type UpdateMembers = UserId & { add: boolean };

export type InitInstitution = Institution & {
  users: AuthProfileMerged[];
  groups: Group[];
  protocols: TrainingProtocol[];
};
