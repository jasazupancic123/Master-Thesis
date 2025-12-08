'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { AuthController } from '@/core/auth/auth.controller';
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
};

export const AuthProvider = (props: React.PropsWithChildren) => {
  console.log('AuthProvider rendered');
  const auth = getFirebaseAuth();
  const { children } = props;
  const router = useRouter();
  const controller = AuthController.getInstance();

  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: undefined,
    role: undefined,
  });

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
      console.log(
        'no user found in handleUserChange, setting state to unauthenticated'
      );
      // user is logged out
      newState = {
        status: 'unauthenticated',
        user: undefined,
        role: undefined,
      };
    } else {
      console.log(
        'user found in handleUserChange, setting state to authenticated'
      );
      // user is logged in
      const role = user.role;
      newState = { status: 'authenticated', user, role };
    }

    console.log('New auth state:', newState);

    setState(newState);
    return newState;
  }

  async function logout(redirect = true): Promise<void> {
    console.log('LOGOUT called');
    handleUserChange(null);
    await auth.signOut();
    await controller.logout();
    if (redirect) {
      console.log('Redirecting to sign-in page after logout');
      window.location.href = LINK_SIGN_IN.href;
    }

    router.refresh();
    router.refresh();
  }

  useEffect(() => {
    console.log('Checking auth state readiness', auth);
    auth.authStateReady().then();
  }, [auth]);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
      console.log('Auth state changed, firebaseUser:', firebaseUser);
      if (firebaseUser) {
        console.log('User is logged in, fetching ID token and user data');
        const idToken = await firebaseUser.getIdToken();
        const user = await controller.sessionLogin(idToken);
        handleUserChange(user);
      } else {
        console.log('User is logged out, clearing auth state');
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
    state.role
  )
    return (
      <AuthContext.Provider
        value={{
          status: 'authenticated',
          user: state.user!,
          role: state.role!,
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

  console.log('Rendering unauthenticated AuthProvider');

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
      console.log('Unauthorized access, redirecting to sign-in page');
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
