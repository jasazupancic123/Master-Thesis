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
import { useAuthenticatedAuth, withAuth } from '@/store/auth-provider';
import { WellnessProvider } from '@/store/wellness-provider';

export default withAuth(WellnessInitializer, [UserRole.ATHLETE]);

function WellnessInitializer(props: ChildrenProps) {
  const { children } = props;
  const { token } = useAuthenticatedAuth();
  const controller = UserController.getInstance(token);

  const [wellness, setWellness] = useState<Wellness | null>(
    getCachedWellness()
  );

  useEffect(() => {
    async function init() {
      if (wellness) return; // already cached
      const fetchedWellness = await controller.getMyMeta();
      setCachedWellness(fetchedWellness);
      setWellness(fetchedWellness);
    }

    init();
  }, [wellness]);

  if (!wellness) return <Alert type="loading" />;
  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
