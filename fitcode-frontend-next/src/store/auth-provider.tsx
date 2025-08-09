'use client';

import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/common/config/firebase.config';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { LINK_INDEX } from '@/common/constant/navigation.constant';
import { CommonService } from '@/common/service/common.service';
import type { AuthContextType } from '@/common/type/context.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';
import type { UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';

const commonService = CommonService.instance;

const AuthContext = createContext<AuthContextType>({
  loading: true,
  user: null,
  setUser: () => {},
  role: [],
  logout: () => Promise.resolve(),
  hasJustLoggedIn: false,
  setHasJustLoggedIn: () => {},
  profile: undefined,
  setProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: ChildrenProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserEntity>({} as UserEntity);

  const [role, setRole] = useState<UserRole[]>([]);
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState<boolean>(true);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, initUser);
  //   return unsubscribe;
  // }, []);

  // async function initUser(user: User | null): Promise<void> {
  //   if (user) {
  //     // user logged in
  //     const tokenResult = await user.getIdTokenResult(true);
  //     const profile = await UserController.findProfile(tokenResult.token);
  //     const claims = tokenResult.claims as unknown as CustomClaims;
  //     setProfile(profile);
  //     setUser({ ...user });
  //     setRole(claims.role || []);
  //     setToken(tokenResult.token);
  //   } else {
  //     // user logged out
  //     setUser(null);
  //     setRole([]);
  //     setToken(null);
  //   }

  //   setLoading(false);
  // }

  useEffect(
    () =>
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          // user logged in
          const token = await user.getIdTokenResult();
          const profile = await UserController.findProfile();
          const claims = token.claims as unknown as CustomClaims;

          setProfile(profile);
          setUser(user);
          setRole(claims.role || []);
        } else {
          // user logged out
          setUser(null);
          setRole([]);
        }

        setLoading(false);
      }),
    []
  );

  async function logout(): Promise<void> {
    await auth.signOut();
    commonService.browser.removeClientCookie(FIREBASE_COOKIE_NAME);
    router.push(LINK_INDEX.href);
    setUser(null);
    setRole([]);
    await new Promise((resolve) => setTimeout(resolve, 5000)); //wait for 5 sec, then set
    setHasJustLoggedIn(true);
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        setUser,
        role,
        logout,
        hasJustLoggedIn,
        setHasJustLoggedIn,
        profile,
        setProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
