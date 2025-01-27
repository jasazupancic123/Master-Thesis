import { UserRole } from '../../user/enum/user-role.enum';
import { UserRecord } from 'firebase-admin/lib/auth';

export type CustomClaims = {
  role: UserRole[],
};

/**
 * Use this interface when using Firebase's `auth.verifyIdToken(token)` method
 */
export type DecodedUser = UserRecord & CustomClaims;

export type User = UserRecord & { customClaims: CustomClaims };