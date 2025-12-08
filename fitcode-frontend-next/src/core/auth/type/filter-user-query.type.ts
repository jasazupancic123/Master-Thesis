import type { UserRole } from '@/core/user/enum/user-role.enum';

export type FilterUsers = {
  ids?: string[];
  emails?: string[];
  role?: UserRole;
};
