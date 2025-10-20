import type { UserRole } from '@/core/profile/enum/user-role.enum';

export type FilterUsers = {
  ids?: string[];
  emails?: string[];
  role?: UserRole;
};
