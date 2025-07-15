'use client';

import { useEffect, useState } from 'react';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { notFound } from 'next/navigation';
import { ChildrenProps } from '@/common/type/props.type';
import {
  WellnessProvider,
  WellnessProviderProps,
} from '@/store/wellness-provider';

export default function WellnessInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<WellnessProviderProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();
        if (!profile) return <div>Unauthorized</div>;

        const role = profile.customClaims.role[0];
        if (![UserRole.ATHLETE].includes(role)) return notFound();

        const wellness = await UserController.getMyMeta();

        const context: WellnessProviderProps = {
          wellness,
        };

        setState(context);
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <WellnessProvider {...state}>{children}</WellnessProvider>;
}
