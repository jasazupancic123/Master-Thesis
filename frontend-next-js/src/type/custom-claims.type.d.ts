import { UserRole } from '@/enum/user-role.enum';
import { SportLevel } from '@/enum/sport-level.enum';

export interface CustomClaims {
    role: UserRole[];
    level: SportLevel;
}