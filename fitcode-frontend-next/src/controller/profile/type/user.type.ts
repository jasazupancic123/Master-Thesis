import type { Gender } from '../enum/gender.enum';
import type { SportLevel } from '../enum/sport-level.enum';
import type { BaseEntity } from '@/common/type/entity.type';

// Firestore Database User
export type Profile = BaseEntity & {
  sport?: string;
  level?: SportLevel;
  gender?: Gender;
  birthDate?: Date;
};

export type UpdateProfile = { userId: string } & Omit<
  Profile,
  'id' | 'createdAt' | 'updatedAt'
>;
