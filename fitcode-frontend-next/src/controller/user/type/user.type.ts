import { BaseEntity } from '@/common/type/entity.type';
import { Gender } from '../enum/gender.enum';
import { SportLevel } from '../enum/sport-level.enum';
import { CustomClaims } from './custom-claims.type';

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
