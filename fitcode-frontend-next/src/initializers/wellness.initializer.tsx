'use client';

import { useEffect, useState } from 'react';

import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import Alert from '../ui/alert';
import { ProfileController } from '@/core/profile/profile.controller';
import type { Wellness } from '@/core/profile/type/wellness.type';
import { WellnessProvider } from '@/store/wellness-provider';

export default function WellnessInitializer(props: React.PropsWithChildren) {
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

  if (!wellness) {
    console.log('Loading in wellness.initializer.tsx');
    return <Alert type="loading" />;
  }
  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
