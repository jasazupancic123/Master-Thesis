import type { UserRecord } from 'firebase-admin/lib/auth';

import type { UserRole } from '@src/auth/enum/user-role.enum';

export type CustomClaims = {
  role: UserRole[];
};

/**
 * Use this interface when using Firebase's `auth.verifyIdToken(token)` method
 */
export type DecodedUser = UserRecord & CustomClaims;

export type FirebaseUser = UserRecord & { customClaims: CustomClaims };
