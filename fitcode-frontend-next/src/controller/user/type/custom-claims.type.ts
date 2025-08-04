import type { UserRole } from '../enum/user-role.enum';

export interface CustomClaims {
  role: UserRole[];
}
