import { BaseEntity } from '@/common/type/entity.type';
import { Gender } from '../enum/gender.enum';
import { SportLevel } from '../enum/sport-level.enum';
import { CustomClaims } from './custom-claims.type';
import { UserRole } from '../enum/user-role.enum';

// Firestore Database User
export type UserEntity = BaseEntity & {
  sport?: string;
  level?: SportLevel;
  gender?: Gender;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: Date;
};

// Firebase Auth User
export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  customClaims: CustomClaims;
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
