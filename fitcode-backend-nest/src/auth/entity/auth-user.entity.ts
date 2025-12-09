import type { FirebaseUser } from '@src/common/type/firebase-auth.type';

export type AuthUser = Pick<
  FirebaseUser,
  'uid' | 'email' | 'displayName' | 'photoURL' | 'customClaims'
>;
