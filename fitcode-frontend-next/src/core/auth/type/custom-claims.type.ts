import type { UserRole } from '@/core/user/enum/user-role.enum';

export interface CustomClaims {
  role: UserRole[];
}
