import type { Gender } from '../enum/gender.enum';
import type { SportLevel } from '../enum/sport-level.enum';
import type { UserRole } from '../enum/user-role.enum';
import type { CustomClaims } from './custom-claims.type';
import type { BaseEntity } from '@/common/type/entity.type';

// Firestore Database User
export type UserEntity = BaseEntity & {
  sport?: string;
  level?: SportLevel;
  gender?: Gender;
  profileImageUrl?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
};

// Firebase Auth User
export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  customClaims: CustomClaims;
  phoneNumber?: string;
}

export type AddAthlete = {
  email: string;
  displayName: string;
  password: string;
};

export type FilterUsers = {
  ids?: string[];
  emails?: string[];
  role?: UserRole;
};

export type UpdateProfile = Pick<
  UserEntity,
  | 'sport'
  | 'level'
  | 'gender'
  | 'profileImageUrl'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'birthDate'
> & { userId: string };
