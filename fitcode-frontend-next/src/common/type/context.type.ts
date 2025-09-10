import type { User } from 'firebase/auth';

import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';
import type { AuthState } from '@/store/auth-provider';

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
      setDisplayName: (name: string) => void;
      logout: (redirect?: boolean) => Promise<void>;
      handleUserChange: (user: User | null) => Promise<AuthState>;
    };
