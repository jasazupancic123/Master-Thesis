'use client';

import type { User } from '@firebase/auth';
import { Skeleton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { getFirebaseAuth } from '@/common/config/firebase.config';
import { FIREBASE_AUTH_ID_TOKEN } from '@/common/constant/browser.constant';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import { CommonService } from '@/common/service/common.service';
import type { AuthContextType } from '@/common/type/context.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';
import type { UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';

const commonService = CommonService.instance;

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export type AuthState = {
  authIdToken?: string;
  user?: User | null;
  role?: UserRole;
  customClaims?: CustomClaims;
};

type AuthProviderProps = ChildrenProps & {
  initialToken?: string;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const auth = getFirebaseAuth();
  const router = useRouter();
  const { children, initialToken } = props;

  const [user, setUser] = useState<User | null>(null);
  const [authIdToken, setAuthIdToken] = useState(initialToken);

  const [profile, setProfile] = useState<UserEntity | undefined>(undefined);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [customClaims, setCustomClaims] = useState<CustomClaims | undefined>(
    undefined
  );

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

  async function handleUserChange(authUser: User | null): Promise<AuthState> {
    if (!authUser) {
      setAuthIdToken(undefined);
      setUser(null);
      setRole(undefined);
      setCustomClaims(undefined);
      commonService.browser.removeClientCookie(FIREBASE_AUTH_ID_TOKEN);

      return {
        authIdToken: undefined,
        user: null,
        role: undefined,
        customClaims: undefined,
      };
    }

    // user is logged in
    const { token, claims } = await authUser.getIdTokenResult();
    const customClaims = claims as unknown as CustomClaims;
    const role = customClaims.role?.[0];

    setAuthIdToken(token);
    setUser(authUser);
    setRole(role);
    setCustomClaims(customClaims);
    commonService.browser.setClientCookie(FIREBASE_AUTH_ID_TOKEN, token);

    await handleProfileChange(token);
    return { authIdToken: token, user: authUser, role, customClaims };
  }

  async function handleProfileChange(token?: string) {
    if (!token) return setProfile(undefined);
    const profile = await UserController.findProfile(token);
    setProfile(profile);
  }

  async function logout(redirect = true): Promise<void> {
    await auth.signOut();
    await handleUserChange(null);
    if (redirect) router.push(LINK_SIGN_IN.href);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        role,
        logout,
        token: authIdToken,
        profile,
        setProfile,
        customClaims,
        setCustomClaims,
        handleUserChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function AuthGuard(props: ChildrenProps) {
  const { children } = props;
  const { user, token, customClaims, role, profile } = useAuth();

  if (!user || !token || !customClaims || !role || !profile)
    return <Skeleton variant="rectangular" width={'100%'} height={50} />;

  return <>{children}</>;
}
