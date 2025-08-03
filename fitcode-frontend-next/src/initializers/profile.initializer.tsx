'use client';

import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import type { ChildrenProps } from '@/common/type/props.type';
import type { User } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import {
  getCachedProfile,
  setCachedProfile,
} from '@/session-cache/profile.session-cache';
import { ProfileProvider } from '@/store/profile-provider';

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

  if (!user) return <Alert type="loading" />;
  if (unauthorized) return <Alert type="unauthorized" />;

  return <ProfileProvider user={user}>{children}</ProfileProvider>;
}
