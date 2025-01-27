import { UserRole } from '@/user/enum/user-role.enum';
import { SportLevel } from '@/user/enum/sport-level.enum';

export interface CustomClaims {
  role: UserRole[];
  level: SportLevel;
}