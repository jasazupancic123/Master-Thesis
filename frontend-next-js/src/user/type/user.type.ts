import { UserRole } from '@/user/enum/user-role.enum';
import { SportLevel } from '@/user/enum/sport-level.enum';
import { CustomClaims } from '@/user/type/custom-claims.type';

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  customClaims: CustomClaims;
}