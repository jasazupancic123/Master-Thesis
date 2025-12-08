'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { AuthController } from '@/core/auth/auth.controller';
import type { CustomClaims } from '@/core/auth/type/custom-claims.type';
import type { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';
import { LINK_SIGN_IN } from '@/lib/common/const/nav.const';
import type {
  AuthStatus,
  IAuthContext,
} from '@/lib/common/type/auth-context.type';
import { getFirebaseAuth } from '@/lib/firebase/config';
import Alert from '@/ui/alert';

const AuthContext = createContext<IAuthContext | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export type AuthState = {
  status: AuthStatus;
  user?: User;
  role?: UserRole;
  customClaims?: CustomClaims;
};

export const AuthProvider = (props: React.PropsWithChildren) => {
  const auth = getFirebaseAuth();
  const { children } = props;
  const router = useRouter();
  const controller = AuthController.getInstance();

  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: undefined,
    role: undefined,
    customClaims: undefined,
  });

  function setCustomClaims(claims: CustomClaims) {
    if (state.status === 'authenticated')
      setState((prevState) => ({ ...prevState, customClaims: claims }));
  }

  function setUser(data: Partial<User>) {
    if (state.status !== 'authenticated') return;
    setState((prevState) => ({
      ...prevState,
      user: { ...prevState.user!, ...data },
    }));
  }

  function handleUserChange(user: User | null): AuthState {
    let newState: AuthState = { ...state, status: 'loading' };

    if (!user) {
      // user is logged out
      newState = {
        status: 'unauthenticated',
        user: undefined,
        role: undefined,
        customClaims: undefined,
      };
    } else {
      // user is logged in
      const role = user.role;
      newState = { status: 'authenticated', user, role };
    }

    setState(newState);
    return newState;
  }

  async function logout(redirect = true): Promise<void> {
    handleUserChange(null);
    await auth.signOut();
    await controller.logout();
    if (redirect) {
      window.location.href = LINK_SIGN_IN.href;
    }
    router.refresh();
    router.refresh();
  }

  useEffect(() => {
    auth.authStateReady().then();
  }, [auth]);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const user = await controller.sessionLogin(idToken);
        handleUserChange(user);
      } else {
        await AuthController.getInstance().logout();
        handleUserChange(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  if (
    auth.currentUser &&
    state.status === 'authenticated' &&
    state.user &&
    state.role &&
    state.customClaims
  )
    return (
      <AuthContext.Provider
        value={{
          status: 'authenticated',
          user: state.user!,
          role: state.role!,
          customClaims: state.customClaims!,
          setCustomClaims,
          handleUserChange,
          setUser,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );

  if (state.status === 'loading')
    return (
      <AuthContext.Provider value={{ status: 'loading', handleUserChange }}>
        {children}
      </AuthContext.Provider>
    );

  return (
    <AuthContext.Provider
      value={{ status: 'unauthenticated', handleUserChange }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export type AuthenticatedAuth<T = unknown> = T & {
  auth: Extract<IAuthContext, { status: 'authenticated' }>;
};

const AuthenticatedAuthContext = createContext<
  AuthenticatedAuth['auth'] | null
>(null);

export const useAuthenticatedAuth = () => useContext(AuthenticatedAuthContext)!;

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function Wrapped(props: P) {
    const auth = useAuth();
    const router = useRouter();

    if (auth.status !== 'authenticated') {
      console.log('Loading in auth.provider.tsx');
      return <Alert type="loading" />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      router.replace(LINK_SIGN_IN.href);
      router.refresh();
      router.refresh();
      return null;
    }

    return (
      <AuthenticatedAuthContext.Provider value={auth}>
        <Component {...props} />
      </AuthenticatedAuthContext.Provider>
    );
  };
}
