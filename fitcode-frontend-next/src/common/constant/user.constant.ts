import { SportLevel } from '@/controller/profile/enum/sport-level.enum';
import { UserRole } from '@/controller/profile/enum/user-role.enum';

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
