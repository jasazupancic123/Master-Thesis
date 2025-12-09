import type { AuthUser } from '@src/auth/entity/auth-user.entity';
import type { UserRole } from '@src/auth/enum/user-role.enum';

import type { Profile } from '../entity/profile.entity';

export type UserType = Pick<
  AuthUser,
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
