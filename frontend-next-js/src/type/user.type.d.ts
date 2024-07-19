import { UserRole } from '@/enum/user-role.enum';
import { SportLevel } from '@/enum/sport-level.enum';

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  customClaims: {
    role: UserRole[],
    level: SportLevel,
    groups: string[],
  }
}