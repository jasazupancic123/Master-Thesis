'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { getFirebaseAuth } from '@/common/config/firebase.config';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import type { AuthContextType, AuthStatus } from '@/common/type/context.type';
import type { ChildrenProps } from '@/common/type/props.type';
import { AuthController } from '@/controller/auth/auth.controller';
import type { CustomClaims } from '@/controller/auth/type/custom-claims.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { UserRole } from '@/controller/profile/enum/user-role.enum';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export type AuthState = {
  status: AuthStatus;
  user?: AuthUser;
  role?: UserRole;
  customClaims?: CustomClaims;
};

export const AuthProvider = (props: ChildrenProps) => {
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

  function setUser(data: Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>) {
    if (state.status !== 'authenticated') return;
    setState((prevState) => ({
      ...prevState,
      user: { ...prevState.user!, ...data },
    }));
  }

  function handleUserChange(user: AuthUser | null): AuthState {
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
      const customClaims = user.customClaims;
      const role = customClaims.role?.[0];

      newState = {
        status: 'authenticated',
        user,
        role,
        customClaims,
      };
    }

    setState(newState);
    return newState;
  }

  async function logout(redirect = true): Promise<void> {
    handleUserChange(null);
    await auth.signOut();
    await controller.logout();
    if (redirect) {
      router.push(LINK_SIGN_IN.href);
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
  auth: Extract<AuthContextType, { status: 'authenticated' }>;
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

    if (auth.status !== 'authenticated') return <div>Loading...</div>;

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      router.replace(LINK_SIGN_IN.href);
      return null;
    }

    return (
      <AuthenticatedAuthContext.Provider value={auth}>
        <Component {...props} />
      </AuthenticatedAuthContext.Provider>
    );
  };
}
