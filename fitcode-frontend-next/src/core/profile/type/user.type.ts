import type { Gender } from '../enum/gender.enum';
import type { SportLevel } from '../enum/sport-level.enum';
import type { TimestampEntity } from '@/core/entity.type';
import type { CreateUser } from '@/core/auth/type/user.type';

// Firestore Database User
export type Profile = TimestampEntity & {
  uid: string;
  email: string;
  sport?: string;
  level?: SportLevel;
  gender?: Gender;
  birthDate?: Date;
};

export type UpdateProfile = { userId: string } & Pick<
  Profile,
  'sport' | 'level' | 'gender' | 'birthDate'
>;

export type ImportProfile = CreateUser &
  Pick<Profile, 'sport' | 'level' | 'gender' | 'birthDate'>;

export type ImportProfiles = {
  profiles: ImportProfile[];
};
