'use client';

import type { User } from '@firebase/auth';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { getFirebaseAuth } from '@/common/config/firebase.config';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import type { AuthContextType, AuthStatus } from '@/common/type/context.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export type AuthState = {
  status: AuthStatus;
  token?: string;
  user?: User;
  role?: UserRole;
  customClaims?: CustomClaims;
};

export const AuthProvider = (props: ChildrenProps) => {
  const { children } = props;
  const auth = getFirebaseAuth();
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    status: 'loading',
    token: undefined,
    user: undefined,
    role: undefined,
    customClaims: undefined,
  });

  function setCustomClaims(claims: CustomClaims) {
    if (state.status === 'authenticated')
      setState((prevState) => ({
        ...prevState,
        customClaims: claims,
      }));
  }

  function setDisplayName(name: string) {
    if (state.status === 'authenticated')
      setState((prevState) => ({
        ...prevState,
        user: { ...prevState.user!, displayName: name },
      }));
  }

  // first time init get token from cookies and refresh if needed
  useEffect(() => {
    async function init() {
      await auth.authStateReady();
      await handleUserChange(auth.currentUser);
    }

    init().then();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(handleUserChange);
    return () => unsubscribe();
  }, [auth]);

  async function handleUserChange(user: User | null): Promise<AuthState> {
    let newState: AuthState = { ...state, status: 'loading' };

    if (!user) {
      // user is logged out
      newState = {
        status: 'unauthenticated',
        token: undefined,
        user: undefined,
        role: undefined,
        customClaims: undefined,
      };
    } else {
      // user is logged in
      const { token, claims } = await user.getIdTokenResult();
      const customClaims = claims as unknown as CustomClaims;
      const role = customClaims.role?.[0];

      newState = {
        status: 'authenticated',
        token,
        user,
        role,
        customClaims,
      };
    }

    setState(newState);
    return newState;
  }

  async function logout(redirect = true): Promise<void> {
    await auth.signOut();
    await handleUserChange(null);
    if (redirect) router.push(LINK_SIGN_IN.href);
  }

  if (
    auth?.currentUser &&
    state.status === 'authenticated' &&
    state.token &&
    state.user &&
    state.role &&
    state.customClaims
  )
    return (
      <AuthContext.Provider
        value={{
          status: 'authenticated',
          token: state.token!,
          user: state.user!,
          role: state.role!,
          customClaims: state.customClaims!,
          setCustomClaims,
          handleUserChange,
          setDisplayName,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );

  if (state.status === 'loading')
    return (
      <AuthContext.Provider
        value={{ status: 'loading', token: undefined, handleUserChange }}
      >
        {children}
      </AuthContext.Provider>
    );

  return (
    <AuthContext.Provider
      value={{ status: 'unauthenticated', token: undefined, handleUserChange }}
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
