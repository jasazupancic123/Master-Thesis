import type { UserRecord } from 'firebase-admin/lib/auth';

import type { UserRole } from '@src/user/enum/user-role.enum';

export type CustomClaims = {
  role: UserRole[];
  faceFrontUrl?: string;
  faceRightUrl?: string;
  faceLeftUrl?: string;
};

/**
 * Use this interface when using Firebase's `auth.verifyIdToken(token)` method
 */
export type DecodedUser = UserRecord & CustomClaims;

export type User = UserRecord & { customClaims: CustomClaims };
