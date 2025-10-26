import type { UserRole } from '@/core/profile/enum/user-role.enum';

export interface CustomClaims {
  role: UserRole[];
  faceFrontUrl?: string;
  faceLeftUrl?: string;
  faceRightUrl?: string;
}
