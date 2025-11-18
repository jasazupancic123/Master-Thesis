import type { Gender } from '../enum/gender.enum';
import type { SportLevel } from '../enum/sport-level.enum';
import type { CreateUser } from '@/core/auth/type/user.type';
import type { TimestampEntity } from '@/core/entity.type';

// Firestore Database User
export type Profile = TimestampEntity & {
  uid: string;
  email: string;
  weight: number;
  height: number;
  photoURLBase64?: string;
  sport?: string;
  level?: SportLevel;
  gender?: Gender;
  birthDate?: Date;
};

export type UpdateProfile = { userId: string } & Pick<
  Profile,
  'photoURLBase64' | 'sport' | 'level' | 'gender' | 'birthDate'
>;

export type ImportProfile = CreateUser &
  Pick<Profile, 'sport' | 'level' | 'gender' | 'birthDate'>;

export type ImportProfiles = {
  profiles: ImportProfile[];
};
