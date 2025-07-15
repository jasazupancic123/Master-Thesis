'use client';

import { useEffect, useState } from 'react';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { notFound } from 'next/navigation';
import { ChildrenProps } from '@/common/type/props.type';
import { WellnessProvider } from '@/store/wellness-provider';
import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import { Wellness } from '@/controller/user/type/wellness.type';

export default function WellnessInitializer({ children }: ChildrenProps) {
  const [wellness, setWellness] = useState<Wellness | null>(
    getCachedWellness()
  );
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      if (wellness) return; // already cached

      try {
        const profile = await UserController.findMe();
        if (!profile) return;

        const role = profile.customClaims.role[0];
        if (![UserRole.ATHLETE].includes(role)) return notFound();

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
