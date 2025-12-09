import type { User as FirebaseUser } from '@firebase/auth';

import type { Gender } from '../enum/gender.enum';
import type { SportLevel } from '../enum/sport-level.enum';
import type { UserRole } from '../enum/user-role.enum';
import type { WellnessZScore } from './wellness.type';
import type { TimestampEntity } from '@/core/entity.type';

export type Profile = TimestampEntity & {
  uid: string;
  email: string;
  wellness: WellnessZScore;
  faceEmbedding?: number[];
  photoURLBase64?: string;
  sport?: string;
  level?: SportLevel;
  gender?: Gender;
  birthDate?: Date;
};

export type User = Pick<
  FirebaseUser,
  'uid' | 'email' | 'displayName' | 'photoURL'
> &
  Pick<
    Profile,
    | 'faceEmbedding'
    | 'birthDate'
    | 'gender'
    | 'level'
    | 'sport'
    | 'photoURLBase64'
    | 'wellness'
  > & {
    role: UserRole;
  };

export type CreateUser = Pick<
  User,
  | 'email'
  | 'displayName'
  | 'photoURLBase64'
  | 'sport'
  | 'level'
  | 'gender'
  | 'birthDate'
  | 'role'
> & {
  password: string;
  photoURL?: string;
};

export type UpdateUser = Partial<
  Pick<
    User,
    | 'displayName'
    | 'photoURL'
    | 'photoURLBase64'
    | 'sport'
    | 'level'
    | 'gender'
    | 'birthDate'
  >
>;

export type ImportUser = CreateUser &
  Pick<User, 'sport' | 'level' | 'gender' | 'birthDate'>;

export type ImportUsers = {
  users: ImportUser[];
};
