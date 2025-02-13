'use client';

import { User } from 'firebase/auth';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { auth } from '@/common/config/firebase.config';
import { useLocalStorage } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { LINK_INDEX } from '@/common/constant/navigation.constant';
import { AuthContextType } from '@/common/type/context.type';
import { CommonService } from '@/common/service/common.service';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { CustomClaims } from '@/controller/user/type/custom-claims.type';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ChildrenProps } from '@/common/type/props.type';

const AuthContext = createContext<AuthContextType>({
  loading: true,
  user: null,
  role: [],
  logout: () => Promise.resolve(),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: ChildrenProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole[]>([]);
  const [_token, setToken] = useLocalStorage<string | null>(
    FIREBASE_COOKIE_NAME,
    null
  );

  useEffect(
    () =>
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          // user logged in
          const token = await user.getIdTokenResult();
          const claims = token.claims as unknown as CustomClaims;

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
    await CommonService.instance.generic.sleep(0.3);
    router.push(LINK_INDEX.href);
    setUser(null);
    setRole([]);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ loading, user, role, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
