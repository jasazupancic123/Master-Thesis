import type { CustomClaims } from '@/core/auth/type/custom-claims.type';
import type { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';
import type { AuthState } from '@/store/auth.provider';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type IAuthContext =
  | {
      status: 'loading';
      handleUserChange: (user: User | null) => AuthState;
    }
  | {
      status: 'unauthenticated';
      handleUserChange: (user: User | null) => AuthState;
    }
  | {
      status: 'authenticated';
      user: User;
      role: UserRole;
      customClaims: CustomClaims;
      setCustomClaims: (claims: CustomClaims) => void;
      setUser: (data: Partial<Pick<User, 'displayName' | 'photoURL'>>) => void;
      logout: (redirect?: boolean) => Promise<void>;
      handleUserChange: (user: User | null) => AuthState;
    };
