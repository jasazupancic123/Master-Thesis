'use client';

import { createContext, useContext } from 'react';

import type { AuthUser } from '@/core/auth/type/user.type';
import type { Profile } from '@/core/profile/type/user.type';
import type { SetStateNullable } from '@/lib/common/type/state.type';

interface Props extends React.PropsWithChildren {
  user: AuthUser;
  profile: Profile;
  setProfile: SetStateNullable<Profile>;
  setUser: SetStateNullable<AuthUser>;
}

const ProfileContext = createContext<Props | null>(null);

export const useProfile = () => useContext(ProfileContext)!;

export function ProfileProvider(props: Props) {
  const { children } = props;
  return (
    <ProfileContext.Provider value={props}>{children}</ProfileContext.Provider>
  );
}
