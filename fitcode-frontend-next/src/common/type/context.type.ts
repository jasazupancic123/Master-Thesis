import type { CustomClaims } from '@/controller/auth/type/custom-claims.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { UserRole } from '@/controller/profile/enum/user-role.enum';
import type { AuthState } from '@/store/auth.provider';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type AuthContextType =
  | {
      status: 'loading';
      handleUserChange: (user: AuthUser | null) => AuthState;
    }
  | {
      status: 'unauthenticated';
      handleUserChange: (user: AuthUser | null) => AuthState;
    }
  | {
      status: 'authenticated';
      user: AuthUser;
      role: UserRole;
      customClaims: CustomClaims;
      setCustomClaims: (claims: CustomClaims) => void;
      setUser: (
        data: Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>
      ) => void;
      logout: (redirect?: boolean) => Promise<void>;
      handleUserChange: (user: AuthUser | null) => AuthState;
    };
