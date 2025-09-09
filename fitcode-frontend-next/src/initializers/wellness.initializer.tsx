'use client';

import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import type { ChildrenProps } from '@/common/type/props.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import type { Wellness } from '@/controller/user/type/wellness.type';
import { UserController } from '@/controller/user/user.controller';
import { useMain } from '@/store/main.provider';
import { WellnessProvider } from '@/store/wellness-provider';

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

  if (unauthorized) return <Alert type="unauthorized" />;
  if (!wellness) return <Alert type="loading" />;

  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
