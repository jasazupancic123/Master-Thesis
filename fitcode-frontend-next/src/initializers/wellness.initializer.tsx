'use client';

import { useEffect, useState } from 'react';

import Alert from '../util/alert/alert';
import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import type { ChildrenProps } from '@/common/type/props.type';
import { ProfileController } from '@/controller/profile/profile.controller';
import type { Wellness } from '@/controller/profile/type/wellness.type';
import { WellnessProvider } from '@/store/wellness-provider';

export default function WellnessInitializer(props: ChildrenProps) {
  const { children } = props;
  const controller = ProfileController.getInstance();

  const [wellness, setWellness] = useState<Wellness | null>(
    getCachedWellness()
  );

  useEffect(() => {
    async function init() {
      if (wellness) return; // already cached
      const fetchedWellness = await controller.getLatestWellnessByUser();
      setCachedWellness(fetchedWellness);
      setWellness(fetchedWellness);
    }

    init();
  }, [wellness]);

  if (!wellness) return <Alert type="loading" />;
  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
