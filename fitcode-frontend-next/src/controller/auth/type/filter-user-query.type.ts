import type { UserRole } from '@/controller/profile/enum/user-role.enum';

export type FilterUsers = {
  ids?: string[];
  emails?: string[];
  role?: UserRole;
};
