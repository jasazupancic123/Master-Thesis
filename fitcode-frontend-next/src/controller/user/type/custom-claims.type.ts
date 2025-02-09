import { SportLevel } from '../enum/sport-level.enum';
import { UserRole } from '../enum/user-role.enum';

export interface CustomClaims {
  role: UserRole[];
  level: SportLevel;
}
