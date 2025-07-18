'use client';

import { useEffect, useState } from 'react';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';
import { ProfileProvider } from '@/store/profile-provider';
import { User } from '@/controller/user/type/user.type';
import {
  getCachedProfile,
  setCachedProfile,
} from '@/session-cache/profile.session-cache';

export default function ProfileInitializer({ children }: ChildrenProps) {
  const [user, setUser] = useState<User | null>(getCachedProfile());
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        if (user) return; // already cached

        const fetchedUser = await UserController.findMe();

        setCachedProfile(fetchedUser);
        setUser(fetchedUser);
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!user) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <ProfileProvider user={user}>{children}</ProfileProvider>;
}
