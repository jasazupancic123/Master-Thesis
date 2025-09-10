'use client';

import { useEffect, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { User } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import {
  getCachedProfile,
  setCachedProfile,
} from '@/session-cache/profile.session-cache';
import { useAuthenticatedAuth } from '@/store/auth-provider';
import { ProfileProvider } from '@/store/profile-provider';

export default function ProfileInitializer({ children }: ChildrenProps) {
  const { token } = useAuthenticatedAuth();
  const [user, setUser] = useState<User | null>(getCachedProfile());

  useEffect(() => {
    async function init() {
      if (user) return; // already cached

      const fetchedUser = await UserController.getInstance(token).findMe();
      setCachedProfile(fetchedUser);
      setUser(fetchedUser);
    }

    init();
  }, []);

  if (!user) return <div>Loading profile...</div>;
  return <ProfileProvider user={user}>{children}</ProfileProvider>;
}
