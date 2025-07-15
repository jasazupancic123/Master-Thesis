'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { User } from '@/controller/user/type/user.type';
import { createContext, useContext, useState } from 'react';

export interface ProfileContextProps {
  user: User;
}

interface ProfileProviderProps extends ProfileContextProps {
  setUser: SetState<User>;
}

const ProfileContext = createContext<ProfileProviderProps | null>(null);

export const useProfile = () => useContext(ProfileContext)!;

export function ProfileProvider(props: ProfileContextProps & ChildrenProps) {
  const { children, user: providedUser } = props;

  const [user, setUser] = useState<User>(providedUser);

  const value: ProfileProviderProps = {
    user,
    setUser,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
