'use client';

import { useEffect, useState } from 'react';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';
import { ProfileContextProps, ProfileProvider } from '@/store/profile-provider';

export default function ProfileInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<ProfileContextProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const user = await UserController.findMe();

        setState({ user });
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <ProfileProvider {...state}>{children}</ProfileProvider>;
}
