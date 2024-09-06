import { UserRole } from '../../user/enum/user-role.enum';
import { UserRecord } from 'firebase-admin/lib/auth';

export type CustomClaims = {
  role: UserRole[],
};

/**
 * Use this interface when using Firebase's `auth.verifyIdToken(token)` method
 */
export type DecodedUser = UserRecord & CustomClaims;

/**
 * Use this interface when using Firestore's `
 */
export type User = UserRecord & { customClaims: CustomClaims };

export interface CanAccess<T> {
  canAccess(user: DecodedUser, item: T, ...args: any[]): boolean;
}