'use client';

import { createContext, useContext } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { SetStateNullable } from '@/common/type/state.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';

export interface ProfileContextProps {
  user: User;
  profile: UserEntity;
  setProfile: SetStateNullable<UserEntity>;
  setUser: SetStateNullable<User>;
}

const ProfileContext = createContext<ProfileContextProps | null>(null);

export const useProfile = () => useContext(ProfileContext)!;

export function ProfileProvider(props: ProfileContextProps & ChildrenProps) {
  const { children } = props;
  return (
    <ProfileContext.Provider value={props}>{children}</ProfileContext.Provider>
  );
}
