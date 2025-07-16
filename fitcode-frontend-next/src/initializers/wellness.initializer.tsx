'use client';

import { useEffect, useState } from 'react';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';
import { WellnessProvider } from '@/store/wellness-provider';
import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import { Wellness } from '@/controller/user/type/wellness.type';
import { useMain } from '@/store/main-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export default function WellnessInitializer({ children }: ChildrenProps) {
  const [wellness, setWellness] = useState<Wellness | null>(
    getCachedWellness()
  );
  const [unauthorized, setUnauthorized] = useState(false);

  const { profile } = useMain();

  useEffect(() => {
    async function init() {
      const roles = profile.customClaims.role;

      if (!roles.includes(UserRole.ATHLETE)) return setUnauthorized(true);

      if (wellness) return; // already cached

      try {
        const fetchedWellness = await UserController.getMyMeta();
        setCachedWellness(fetchedWellness);
        setWellness(fetchedWellness);
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, [wellness]);

  if (!wellness) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
