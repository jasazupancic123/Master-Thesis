import type { User } from 'firebase/auth';

import type { SetState, SetStateNullable } from './state.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';
import type { UserEntity } from '@/controller/user/type/user.type';
import type { AuthState } from '@/store/auth-provider';

export type AuthContextType = {
  user: User | null;
  setUser: SetState<User | null>;
  role: UserRole | undefined;
  logout: (redirect?: boolean) => Promise<void>;
  token: string | undefined;
  profile: UserEntity | undefined;
  setProfile: (profile: UserEntity) => void;
  customClaims: CustomClaims | undefined;
  setCustomClaims: SetStateNullable<CustomClaims>;
  handleUserChange: (user: User | null) => Promise<AuthState>;
};
