'use client';

import { useEffect, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import {
  getCachedProfile,
  getCachedUser,
  setCachedProfile,
  setCachedUser,
} from '@/session-cache/profile.session-cache';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { ProfileProvider } from '@/store/profile.provider';

export default function ProfileInitializer({ children }: ChildrenProps) {
  const { token } = useAuthenticatedAuth();

  const [user, setUser] = useState<User | undefined>(
    getCachedUser() || undefined
  );

  const [profile, setProfile] = useState<UserEntity | undefined>(
    getCachedProfile() || undefined
  );

  useEffect(() => {
    async function init() {
      if (user || profile) return; // already cached

      const fetchedUser = await UserController.getInstance(token).findMe();
      setCachedUser(fetchedUser);
      setUser(fetchedUser);

      const fetchedProfile =
        await UserController.getInstance(token).findProfile();
      setCachedProfile(fetchedProfile);
      setProfile(fetchedProfile);
    }

    init();
  }, []);

  if (!user || !profile) return <div>Loading profile...</div>;
  return (
    <ProfileProvider
      user={user}
      setUser={setUser}
      profile={profile}
      setProfile={setProfile}
    >
      {children}
    </ProfileProvider>
  );
}
