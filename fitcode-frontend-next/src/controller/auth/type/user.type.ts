import type { User } from '@firebase/auth';

import type { CustomClaims } from './custom-claims.type';

// Firebase Auth User
export type AuthUser = Pick<
  User,
  'uid' | 'email' | 'displayName' | 'photoURL'
> & {
  customClaims: CustomClaims;
};

export type UpdateUser = Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>;
