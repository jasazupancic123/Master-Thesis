import { BaseEntity } from '@/common/type/entity.type';
import { SportLevel } from '../enum/sport-level.enum';
import { CustomClaims } from './custom-claims.type';

// Firestore Database User
export type UserEntity = BaseEntity & {
  level: SportLevel;
  groupsIds: string[];
};

// Firebase Auth User
export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  customClaims: CustomClaims;
}
