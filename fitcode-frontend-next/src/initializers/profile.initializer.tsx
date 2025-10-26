'use client';

import { useEffect, useState } from 'react';

import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';
import { ProfileController } from '@/core/profile/profile.controller';
import type { Profile } from '@/core/profile/type/user.type';
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
