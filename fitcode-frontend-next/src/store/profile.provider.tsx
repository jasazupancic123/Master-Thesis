'use client';

import { createContext, useContext } from 'react';

import type { User } from '@/core/user/type/user.type';
import type { SetStateNullable } from '@/lib/common/type/state.type';

interface Props extends React.PropsWithChildren {
  user: User;
  setUser: SetStateNullable<User>;
}

const ProfileContext = createContext<Props | null>(null);

export const useProfile = () => useContext(ProfileContext)!;

export function ProfileProvider(props: Props) {
  const { children } = props;
  return (
    <ProfileContext.Provider value={props}>{children}</ProfileContext.Provider>
  );
}
