'use client';

import { useEffect, useState } from 'react';

import type { User } from '@/core/user/type/user.type';
import { UserController } from '@/core/user/user.controller';
import {
  getCachedProfile,
  getCachedUser,
  setCachedProfile,
  setCachedUser,
} from '@/session-cache/profile.session-cache';
import { ProfileProvider } from '@/store/profile.provider';

export default function ProfileInitializer({
  children,
}: React.PropsWithChildren) {
  const [user, setUser] = useState<User | undefined>(
    getCachedUser() || undefined
  );

  const [profile, setProfile] = useState<User | undefined>(
    getCachedProfile() || undefined
  );

  useEffect(() => {
    async function init() {
      if (user || profile) return; // already cached

      const fetchedUser = await UserController.getInstance().findMe();
      setCachedUser(fetchedUser);
      setUser(fetchedUser);

      const fetchedProfile = await UserController.getInstance().findMe();
      setCachedProfile(fetchedProfile);
      setProfile(fetchedProfile);
    }

    init();
  }, []);

  if (!user || !profile) return <div>Loading profile...</div>;
  return (
    <ProfileProvider user={user} setUser={setUser}>
      {children}
    </ProfileProvider>
  );
}
