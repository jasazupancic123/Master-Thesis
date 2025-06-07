'use client';

import { auth } from '@/common/config/firebase.config';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { LINK_INDEX } from '@/common/constant/navigation.constant';
import { CommonService } from '@/common/service/common.service';
import { AuthContextType } from '@/common/type/context.type';
import { ChildrenProps } from '@/common/type/props.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { CustomClaims } from '@/controller/user/type/custom-claims.type';
import { UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const commonService = CommonService.instance;

const AuthContext = createContext<AuthContextType>({
  loading: true,
  user: null,
  role: [],
  logout: () => Promise.resolve(),
  hasJustLoggedIn: false,
  setHasJustLoggedIn: (value: boolean) => {},
  profile: undefined,
  setProfile: (profile: UserEntity) => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: ChildrenProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserEntity>({} as UserEntity);

  const [role, setRole] = useState<UserRole[]>([]);
  const [_token, setToken] = useLocalStorage<string | null>(
    FIREBASE_COOKIE_NAME,
    null
  );
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState<boolean>(true);

  useEffect(
    () =>
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          // user logged in
          const token = await user.getIdTokenResult();
          const profile = await UserController.findProfile(token.token);
          const claims = token.claims as unknown as CustomClaims;

          setProfile(profile);
          setUser(user);
          setRole(claims.role || []);
          setToken(token.token);
        } else {
          // user logged out
          setUser(null);
          setRole([]);
          setToken(null);
        }

        setLoading(false);
      }),
    [setToken]
  );

  async function logout(): Promise<void> {
    await auth.signOut();
    commonService.browser.removeClientCookie(FIREBASE_COOKIE_NAME);
    router.push(LINK_INDEX.href);
    setUser(null);
    setRole([]);
    setToken(null);
    await new Promise((resolve) => setTimeout(resolve, 5000)); //wait for 5 sec, then set
    setHasJustLoggedIn(true);
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        role,
        logout,
        hasJustLoggedIn,
        setHasJustLoggedIn,
        profile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
