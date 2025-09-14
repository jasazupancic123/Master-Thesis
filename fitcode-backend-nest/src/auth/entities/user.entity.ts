import type { User } from '@src/common/type/firebase-auth.type';

export type AuthUser = Pick<
  User,
  'email' | 'displayName' | 'photoURL' | 'customClaims'
>;
