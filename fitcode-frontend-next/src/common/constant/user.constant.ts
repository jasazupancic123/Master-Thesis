import { SportLevel } from '@/controller/user/enum/sport-level.enum';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export const ALL_ROLES = [
  UserRole.ATHLETE,
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
];

export const ALL_LEVELS = [
  SportLevel.BEGINNER,
  SportLevel.INTERMEDIATE,
  SportLevel.ADVANCED,
];
