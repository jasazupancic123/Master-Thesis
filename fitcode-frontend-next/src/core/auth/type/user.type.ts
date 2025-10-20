import type { User } from '@firebase/auth';

import type { CustomClaims } from './custom-claims.type';
import type { UserRole } from '@/core/profile/enum/user-role.enum';

// Firebase Auth User
export type AuthUser = Pick<
  User,
  'uid' | 'email' | 'displayName' | 'photoURL'
> & {
  customClaims: CustomClaims;
};

export type CreateUser = Omit<AuthUser, 'uid' | 'customClaims'> & {
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
};

export type UpdateUser = Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>;
