import type { User } from '@firebase/auth';

import type { CustomClaims } from './custom-claims.type';
import type { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Profile } from '@/core/profile/type/user.type';

// Firebase Auth User
export type AuthUser = Pick<
  User,
  'uid' | 'email' | 'displayName' | 'photoURL'
> & {
  customClaims: CustomClaims;
};

export type CreateUser = Omit<AuthUser, 'uid' | 'customClaims' | 'photoURL'> & {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
};

export type UpdateUser = Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>;

export type AuthProfileMerged = Pick<
  AuthUser,
  'uid' | 'email' | 'displayName' | 'photoURL'
> &
  Pick<
    Profile,
    'birthDate' | 'gender' | 'level' | 'sport' | 'photoURLBase64' | 'wellness'
  > & {
    role: UserRole;
    faceEmbedding: number[];
  };
