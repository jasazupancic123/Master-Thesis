import { DecodedIdToken } from 'firebase-admin/auth';
import { UserRole } from '../../user/enum/user-role.enum';
import { SportLevel } from '../../user/enum/sport-level.enum';

export type CustomClaims = DecodedIdToken & {
  role: UserRole[],
  level: SportLevel,
  groups: string[],
};

export interface CanAccess<T> {
  canAccess(user: CustomClaims, item: T, ...args: any[]): boolean;
}