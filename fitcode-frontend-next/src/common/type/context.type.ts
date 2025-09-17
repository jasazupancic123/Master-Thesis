import type { User } from 'firebase/auth';

import type { CustomClaims } from '@/controller/auth/type/custom-claims.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { UserRole } from '@/controller/profile/enum/user-role.enum';
import type { AuthState } from '@/store/auth.provider';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type AuthContextType =
  | {
      status: 'loading';
      token: undefined;
      handleUserChange: (user: User | null) => Promise<AuthState>;
    }
  | {
      status: 'unauthenticated';
      token: undefined;
      handleUserChange: (user: User | null) => Promise<AuthState>;
    }
  | {
      status: 'authenticated';
      token: string;
      user: User;
      role: UserRole;
      customClaims: CustomClaims;
      setCustomClaims: (claims: CustomClaims) => void;
      setUser: (
        data: Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>
      ) => void;
      logout: (redirect?: boolean) => Promise<void>;
      handleUserChange: (user: User | null) => Promise<AuthState>;
    };
