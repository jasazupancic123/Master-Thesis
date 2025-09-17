'use client';

import { createContext, useContext } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { SetStateNullable } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Profile } from '@/controller/profile/type/user.type';

export interface ProfileContextProps {
  user: AuthUser;
  profile: Profile;
  setProfile: SetStateNullable<Profile>;
  setUser: SetStateNullable<AuthUser>;
}

const ProfileContext = createContext<ProfileContextProps | null>(null);

export const useProfile = () => useContext(ProfileContext)!;

export function ProfileProvider(props: ProfileContextProps & ChildrenProps) {
  const { children } = props;
  return (
    <ProfileContext.Provider value={props}>{children}</ProfileContext.Provider>
  );
}
