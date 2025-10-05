'use client';

import { useEffect, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import { AuthController } from '@/controller/auth/auth.controller';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { ProfileController } from '@/controller/profile/profile.controller';
import type { Profile } from '@/controller/profile/type/user.type';
import {
  getCachedProfile,
  getCachedUser,
  setCachedProfile,
  setCachedUser,
} from '@/session-cache/profile.session-cache';
import { ProfileProvider } from '@/store/profile.provider';

export default function ProfileInitializer({ children }: ChildrenProps) {
  const [user, setUser] = useState<AuthUser | undefined>(
    getCachedUser() || undefined
  );

  const [profile, setProfile] = useState<Profile | undefined>(
    getCachedProfile() || undefined
  );

  useEffect(() => {
    async function init() {
      if (user || profile) return; // already cached

      const fetchedUser = await AuthController.getInstance().findMe();
      setCachedUser(fetchedUser);
      setUser(fetchedUser);

      const fetchedProfile =
        await ProfileController.getInstance().findProfile();
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
