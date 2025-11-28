'use client';

import { useEffect, useState } from 'react';

import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import Alert from '../ui/alert';
import type { Wellness } from '@/core/profile/type/wellness.type';
import { useMain } from '@/store/main.provider';
import { WellnessProvider } from '@/store/wellness-provider';

export default function WellnessInitializer(props: React.PropsWithChildren) {
  const { children } = props;

  const { profile } = useMain();
  const [wellness, setWellness] = useState<Wellness | null>(
    getCachedWellness()
  );

  useEffect(() => {
    if (wellness) return; // already cached
    setCachedWellness(profile.wellness);
    setWellness(profile.wellness);
  }, [wellness]);

  if (!wellness) {
    console.log('Loading in wellness.initializer.tsx');
    return <Alert type="loading" />;
  }
  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
