import { UserRole } from '@/enum/user-role.enum';
import { SportLevel } from '@/enum/sport-level.enum';

export const ALL_ROLES = [
  UserRole.ATHLETE,
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]

export const ALL_LEVELS = [
  SportLevel.BEGINNER,
  SportLevel.INTERMEDIATE,
  SportLevel.ADVANCED,
]